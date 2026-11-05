// The memory smoke (--minutes 10) and soak (--minutes 60) of the sandbox daemon on a fresh dev sandbox, killed at the end.
// usage: node daemon/memory/run.mjs --minutes <n> [--template <name>-dev[:tag]] [--out <dir>]
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { Sandbox } from 'e2b'

const BUDGET = {
  peakRss: 80 * 2 ** 20,
  afterIdleRss: 64 * 2 ** 20,
  afterIdleGrowth: 8 * 2 ** 20,
  fdsGrowth: 2,
  slopePerHour: 6 * 2 ** 20,
}
const REMOTE = '/tmp/subbly-memory'
const DOMAIN = 'e2b.app'
const MB = 2 ** 20

const { values } = parseArgs({ options: { minutes: { type: 'string' }, template: { type: 'string' }, out: { type: 'string' } } })
const minutes = Number(values.minutes)
const template = values.template ?? process.env.E2B_TEMPLATE ?? ''
const apiKey = process.env.E2B_API_KEY
const root = new URL('..', import.meta.url).pathname
const out = values.out ?? join(tmpdir(), `sandbox-daemon-memory-${new Date().toISOString().replace(/[:.]/g, '-')}`)

if (!Number.isInteger(minutes) || minutes < 5) {
  throw new Error('Pass --minutes with at least 5')
}

if (!/-dev(:|$)/.test(template)) {
  throw new Error(`Template ${template || '(none)'} is not a dev template; set E2B_TEMPLATE or --template to a *-dev template`)
}

execFileSync('node', [join(root, 'manifest.mjs'), '--check'], { stdio: 'inherit' })

const bundle = join(root, 'bundle')
const manifest = JSON.parse(readFileSync(join(bundle, 'manifest.json'), 'utf8'))
const sandbox = await Sandbox.create(template, { apiKey, domain: DOMAIN, timeoutMs: (minutes + 20) * 60_000 })

console.log(`sandbox ${sandbox.sandboxId} from ${template}, daemon ${manifest.build}, ${minutes} min, results in ${out}`)

try {
  const staging = `/tmp/subbly-daemon-${manifest.build}`

  await sandbox.files.write([
    ...readdirSync(bundle).map((name) => ({ path: `${staging}/${name}`, data: name.endsWith('.node') ? new Uint8Array(readFileSync(join(bundle, name))).buffer : readFileSync(join(bundle, name), 'utf8') })),
    { path: `${REMOTE}/soak.mjs`, data: readFileSync(join(root, 'memory/soak.mjs'), 'utf8') },
])
  await sandbox.commands.run(`sh ${staging}/install.sh`, { user: 'root', timeoutMs: 120_000 })

  const version = await sandbox.commands.run('for attempt in 1 2 3 4 5 6 7 8 9 10; do curl -sf --unix-socket /run/subbly/daemon.sock http://daemon/version && exit 0; sleep 1; done; exit 1')

  if (JSON.parse(version.stdout).build !== manifest.build) {
    throw new Error(`The sandbox runs daemon ${version.stdout}, expected ${manifest.build}`)
}

  const unit = await sandbox.commands.run('systemctl show subbly-daemon -p MemoryHigh -p MemoryMax -p MemoryCurrent -p ExecStart; cat /sys/fs/cgroup/cgroup.controllers')

  console.log(unit.stdout)
  await sandbox.commands.run(`node ${REMOTE}/soak.mjs ${minutes} ${REMOTE}/out > ${REMOTE}/soak.log 2>&1`, { background: true, timeoutMs: 0 })

  for (let polls = 0; ; polls++) {
    await new Promise((resolve) => setTimeout(resolve, 30_000))

    if (polls % 20 === 19) {
      await sandbox.setTimeout(30 * 60_000)
}

    const state = await sandbox.commands.run(`test -f ${REMOTE}/out/done && echo done || tail -c 400 ${REMOTE}/soak.log`)

    if (state.stdout.trim() === 'done') {
      break
}

    if (state.stdout.trim()) {
      throw new Error(`The soak script failed: ${state.stdout}`)
}

    if (polls > minutes * 2 + 10) {
      throw new Error('The soak script never finished')
}
}

  mkdirSync(out, { recursive: true })

  for (const name of ['plan.json', 'marks.jsonl', 'samples.jsonl', 'counts.json']) {
    writeFileSync(join(out, name), await sandbox.files.read(`${REMOTE}/out/${name}`))
}
} finally {
  await Sandbox.kill(sandbox.sandboxId, { apiKey, domain: DOMAIN })
  console.log(`killed ${sandbox.sandboxId}`)
}

const lines = (name) =>
  readFileSync(join(out, name), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
const samples = lines('samples.jsonl')
const marks = Object.fromEntries(lines('marks.jsonl').map((entry) => [entry.mark, entry.t]))
const counts = JSON.parse(readFileSync(join(out, 'counts.json'), 'utf8'))
const between = (from, to) => samples.filter((entry) => entry.t >= from && entry.t <= to)
const median = (numbers) => [...numbers].sort((a, b) => a - b)[Math.floor(numbers.length / 2)] ?? 0
const slope = (points) => {
  const meanT = points.reduce((sum, point) => sum + point.t, 0) / points.length
  const meanRss = points.reduce((sum, point) => sum + point.rss, 0) / points.length
  const covariance = points.reduce((sum, point) => sum + (point.t - meanT) * (point.rss - meanRss), 0)
  const variance = points.reduce((sum, point) => sum + (point.t - meanT) ** 2, 0)

  return variance === 0 ? 0 : (covariance / variance) * 3_600_000
}

const idle = between(marks['idle-start'] ?? 0, marks['load-start'] ?? 0)
const loadStart = marks['load-start'] ?? 0
const loadEnd = marks['load-end'] ?? 0
const loaded = between(loadStart, loadEnd)
const afterIdle = between(loadEnd + ((marks['after-idle-end'] ?? 0) - loadEnd) / 2, marks['after-idle-end'] ?? 0)
const last = samples.at(-1)

if (!last || idle.length === 0 || loaded.length === 0 || afterIdle.length === 0) {
  throw new Error(`Too few samples in ${out}`)
}

const report = {
  build: manifest.build,
  minutes,
  idle: { rss: median(idle.map((entry) => entry.rss)), anon: median(idle.map((entry) => entry.anon)), fds: median(idle.map((entry) => entry.fds)), inotify: median(idle.map((entry) => entry.inotify)), threads: median(idle.map((entry) => entry.threads)) },
  load: { rssMax: Math.max(...loaded.map((entry) => entry.rss)), anonMax: Math.max(...loaded.map((entry) => entry.anon)), fdsMax: Math.max(...loaded.map((entry) => entry.fds)), cpuPercent: (loaded.at(-1) .cpu - loaded[0] .cpu) / ((loaded.at(-1) .t - loaded[0] .t) / 1000) },
  peakRss: last.hwm,
  afterIdle: { rss: median(afterIdle.map((entry) => entry.rss)), anon: median(afterIdle.map((entry) => entry.anon)), fds: last.fds, inotify: last.inotify },
  slopePerHour: slope(between(loadStart + (loadEnd - loadStart) / 2, loadEnd)),
  restarts: new Set(samples.map((entry) => entry.pid)).size - 1,
  failedRequests: Object.entries(counts).filter(([name]) => !['cut-mid-request', 'stalled-reader'].includes(name)).reduce((sum, [, count]) => sum + count.failed, 0),
  requests: counts,
}
const checks = [
  { name: `peak RSS ${(report.peakRss / MB).toFixed(1)} MB <= ${BUDGET.peakRss / MB} MB`, pass: report.peakRss <= BUDGET.peakRss },
  { name: `after-idle RSS ${(report.afterIdle.rss / MB).toFixed(1)} MB <= ${BUDGET.afterIdleRss / MB} MB`, pass: report.afterIdle.rss <= BUDGET.afterIdleRss },
  { name: `after-idle RSS grew ${((report.afterIdle.rss - report.idle.rss) / MB).toFixed(1)} MB over idle, <= ${BUDGET.afterIdleGrowth / MB} MB`, pass: report.afterIdle.rss - report.idle.rss <= BUDGET.afterIdleGrowth },
  { name: `fds back to baseline (${report.idle.fds} -> ${report.afterIdle.fds})`, pass: report.afterIdle.fds <= report.idle.fds + BUDGET.fdsGrowth },
  { name: `inotify watches back to baseline (${report.idle.inotify} -> ${report.afterIdle.inotify})`, pass: report.afterIdle.inotify === report.idle.inotify },
  { name: `no daemon restarts (${report.restarts})`, pass: report.restarts === 0 },
  { name: `no failed requests (${report.failedRequests})`, pass: report.failedRequests === 0 },
  ...(minutes >= 30 ? [{ name: `RSS slope over the second half ${(report.slopePerHour / MB).toFixed(2)} MB/h <= ${BUDGET.slopePerHour / MB}`, pass: report.slopePerHour <= BUDGET.slopePerHour }] : []),
]

writeFileSync(join(out, 'report.json'), JSON.stringify({ ...report, checks }, null, 2))
console.log(JSON.stringify(report, null, 2))
checks.forEach((check) => console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}`))
process.exitCode = checks.every((check) => check.pass) ? 0 : 1
