// Watches subbly-dev's whole process tree (the `next dev` launcher + its forked
// `next-server` child + workers) and restarts it when total RSS stays over the
// limit for SUSTAIN_MS.
const fs = require('node:fs')
const { execSync } = require('node:child_process')

const TARGET = process.env.WATCH_TARGET || 'subbly-dev'
const LIMIT_MB = Number(process.env.MEM_LIMIT_MB || 4500)
const SUSTAIN_MS = Number(process.env.SUSTAIN_MS || 30000)
const INTERVAL_MS = Number(process.env.INTERVAL_MS || 10000)
let overSince = 0 // when the tree first went over the limit (0 = currently under)
let cooldown = 0 // don't restart again until this time (lets a fresh tree settle)

setInterval(() => {
  let root
  try { root = execSync(`pm2 pid ${TARGET}`).toString().trim() } catch { return }
  if (!root || root === '0') return // app down / restarting

  const ps = {} // pid -> { ppid, rss (kB) }
  for (const d of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(d)) continue
    try {
      const s = fs.readFileSync(`/proc/${d}/status`, 'utf8')
      ps[d] = { ppid: s.match(/PPid:\s+(\d+)/)[1], rss: +(s.match(/VmRSS:\s+(\d+)/)?.[1] || 0) }
    } catch {} // process vanished between readdir and read
  }

  const tree = new Set([root]) // root + all descendants
  for (let grew = true; grew; ) {
    grew = false
    for (const pid in ps) if (!tree.has(pid) && tree.has(ps[pid].ppid)) { tree.add(pid); grew = true }
  }

  let mb = 0
  for (const pid of tree) mb += (ps[pid]?.rss || 0) / 1024
  mb = Math.round(mb)

  const now = Date.now()
  if (mb > LIMIT_MB) { if (!overSince) overSince = now } else { overSince = 0 } // reset the timer once it drops back under
  const overFor = overSince ? Math.round((now - overSince) / 1000) : 0

  console.log(
    `[dev-watchdog] ${TARGET} tree ${mb} MB / ${LIMIT_MB} MB (${tree.size} procs)` +
    (overSince ? ` — over ${overFor}s/${SUSTAIN_MS / 1000}s` : '')
  )

  if (overSince && now - overSince >= SUSTAIN_MS && now > cooldown) {
    console.log(`[dev-watchdog] sustained over limit — restarting ${TARGET}`)
    try { execSync(`pm2 restart ${TARGET}`); cooldown = now + 60000; overSince = 0 } catch (e) { console.log(e.message) }
  }
}, INTERVAL_MS)
