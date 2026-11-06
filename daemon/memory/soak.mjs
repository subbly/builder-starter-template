import { execFileSync } from 'node:child_process'
import { appendFileSync, mkdirSync, readFileSync, readdirSync, readlinkSync, rmSync, writeFileSync } from 'node:fs'
import { request } from 'node:http'
import { connect } from 'node:net'
import { join } from 'node:path'

const [minutesArgument, out] = process.argv.slice(2)
const minutes = Number(minutesArgument)
const SOCKET = '/run/subbly/daemon.sock'
const PORT = 29170
const OUTPUT_LOG = '/project/workspace/.subbly/logs/output.log'
const MAIN = '/project/workspace/main'
const CHURN = `${MAIN}/soak-churn`
const idleMs = Math.max(60_000, minutes * 3_000)
const afterIdleMs = Math.max(120_000, minutes * 4_000)
const loadMs = minutes * 60_000 - idleMs - afterIdleMs

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const now = () => Date.now()
const record = (file, line) => appendFileSync(join(out, file), JSON.stringify({ t: now(), ...line }) + '\n')
const mark = (name) => record('marks.jsonl', { mark: name })

const daemonPid = () => Number(execFileSync('systemctl', ['show', '-p', 'MainPID', '--value', 'subbly-daemon.service'], { encoding: 'utf8' }).trim())

const get = (target, path, agent) =>
  new Promise((resolve, reject) => {
    const outgoing = request({ ...target, path, agent: agent ? undefined : false, timeout: 5_000 }, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => (body += chunk))
      response.on('end', () => (response.statusCode === 200 ? resolve(body) : reject(new Error(`status ${response.statusCode}`))))
})
    outgoing.on('timeout', () => outgoing.destroy(new Error('timeout')))
    outgoing.on('error', reject)
    outgoing.end()
})

const sample = async () => {
  const pid = daemonPid()
  const proc = `/proc/${pid}`
  const status = readFileSync(`${proc}/status`, 'utf8')
  const field = (name) => Number(new RegExp(`^${name}:\\s+(\\d+)`, 'm').exec(status)?.[1] ?? 0)
  const fds = readdirSync(`${proc}/fd`)
  const inotify = fds.reduce((watches, fd) => {
    try {
      return readlinkSync(`${proc}/fd/${fd}`) === 'anon_inode:inotify'
        ? watches + readFileSync(`${proc}/fdinfo/${fd}`, 'utf8').split('\n').filter((line) => line.startsWith('inotify wd:')).length
        : watches
} catch {
      return watches
}
}, 0)
  const ticks = readFileSync(`${proc}/stat`, 'utf8').split(') ')[1]?.split(' ') ?? []
  const stats = await get({ socketPath: SOCKET }, '/stats', false).then((body) => JSON.parse(body), () => null)

  record('samples.jsonl', {
    pid,
    rss: field('VmRSS') * 1024,
    anon: field('RssAnon') * 1024,
    hwm: field('VmHWM') * 1024,
    threads: field('Threads'),
    fds: fds.length,
    inotify,
    cpu: Number(ticks[11]) + Number(ticks[12]),
    stats,
})
}

const counts = {}
const count = (name, ok) => {
  counts[name] ??= { ok: 0, failed: 0 }
  counts[name][ok ? 'ok' : 'failed']++
}

const clients = [
  { name: 'version-tcp', everyMs: 250, run: () => get({ host: '127.0.0.1', port: PORT }, '/version', Math.random() < 0.5) },
  { name: 'version-socket', everyMs: 500, run: () => get({ socketPath: SOCKET }, '/version', Math.random() < 0.5) },
  { name: 'stats-socket', everyMs: 1_000, run: () => get({ socketPath: SOCKET }, '/stats', false) },
  {
    name: 'cut-mid-request',
    everyMs: 2_000,
    run: () =>
      new Promise((resolve) => {
        const socket = connect(PORT, '127.0.0.1', () => socket.write('GET /version HTTP/1.1\r\nHost: daemon\r\n'))
        socket.on('error', () => {})
        setTimeout(() => {
          socket.destroy()
          resolve()
}, Math.random() * 3_000)
}),
},
  {
    name: 'stalled-reader',
    everyMs: 10_000,
    run: () =>
      new Promise((resolve) => {
        const socket = connect({ path: SOCKET }, () => socket.write('GET /stats HTTP/1.1\r\nHost: daemon\r\n\r\n'.repeat(50)))
        socket.pause()
        socket.on('error', () => {})
        setTimeout(() => {
          socket.destroy()
          resolve()
}, 30_000)
}),
},
]

const load = async (until) => {
  const timers = clients.map((client) =>
    setInterval(() => {
      client.run().then(
        () => count(client.name, true),
        () => count(client.name, false),
)
}, client.everyMs),
)

  await sleep(until - now())
  timers.forEach(clearInterval)
}

const writer = async (until) => {
  let line = 0
  let rotated = false
  const write = (lines, width = 60) => appendFileSync(OUTPUT_LOG, Array.from({ length: lines }, () => `${JSON.stringify({ message: `SEQ ${++line} ${'x'.repeat(width)}\n`, timestamp: new Date().toISOString(), type: 'out', process_id: 0, app_name: 'subbly-dev' })}\n`).join(''))

  while (now() < until) {
    write(1)

    if (line % 900 === 0) {
      write(500)
}

    if (!rotated && now() > until - loadMs / 2) {
      rotated = true
      mark('rotation-burst')

      for (let round = 0; round < 50; round++) {
        write(1_000, 100)
        await sleep(200)
}
}

    await sleep(200)
}
}

const churn = async (until) => {
  rmSync(CHURN, { recursive: true, force: true })
  mkdirSync(CHURN)

  for (let round = 0; now() < until; round++) {
    const directory = join(CHURN, `d${round}`)

    mkdirSync(join(directory, 'a', 'b'), { recursive: true })
    mkdirSync(join(directory, 'node_modules', 'pkg'), { recursive: true })
    writeFileSync(join(directory, 'node_modules', 'pkg', 'index.js'), 'x')

    for (let file = 0; file < 10; file++) {
      writeFileSync(join(directory, file < 4 ? '' : file < 7 ? 'a' : 'a/b', `f${file}.txt`), 'x')
}

    rmSync(join(CHURN, `d${round - 3}`), { recursive: true, force: true })

    if (round % 24 === 0) {
      const burst = join(CHURN, `burst${round}`)

      mkdirSync(burst)

      for (let file = 0; file < 300; file++) {
        writeFileSync(join(burst, `f${file}.txt`), 'x')
}

      setTimeout(() => rmSync(burst, { recursive: true, force: true }), 20_000)
}

    await sleep(5_000)
}

  rmSync(CHURN, { recursive: true, force: true })
}

mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'plan.json'), JSON.stringify({ minutes, idleMs, loadMs, afterIdleMs }))

const sampler = setInterval(() => void sample().catch((error) => record('errors.jsonl', { error: String(error) })), 10_000)

await sample()
mark('idle-start')
await sleep(idleMs)
mark('load-start')

const loadEnd = now() + loadMs

await Promise.all([load(loadEnd), writer(loadEnd), churn(loadEnd)])
mark('load-end')
await sleep(afterIdleMs)
mark('after-idle-end')
clearInterval(sampler)
await sample()
writeFileSync(join(out, 'counts.json'), JSON.stringify(counts))
writeFileSync(join(out, 'done'), '')
