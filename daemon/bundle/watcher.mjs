import { lstatSync, opendirSync, readFileSync, readdirSync, readlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import { skipped } from './paths.mjs'

// @parcel/watcher-linux-x64-glibc 2.6.0, loaded without its JS wrapper
const binding = createRequire(import.meta.url)('./parcel-watcher.node')
let queue = Promise.resolve()
const serial = (call) => (queue = queue.then(call, call))
const IGNORED = '(?:.*/)?(?:node_modules|\\.next|\\.git|\\.env[^/]*|\\.npmrc|[^/]*\\.pem|[^/]*\\.key)'

export const BATCH_EVENTS = 1000
export const BURST_QUIET = 300
export const BURST_WAIT = 5000
export const GRACE = 600
export const ROOT_POLL = 1000

export function watcher(root, { events, overflow, restarted }, options = {}) {
  const { maxEvents = BATCH_EVENTS, burstQuiet = BURST_QUIET, burstWait = BURST_WAIT, grace = GRACE, rootPoll = ROOT_POLL, parcel = binding, watchedInodes = inotifyInodes } = options
  const dirs = new Map()
  let generation = 0
  let current = null
  let previous = null
  let swap = null
  let next = null
  let burst = null
  let pollTimer = null
  let graceTimer = null
  let closed = false
  let lately = new Set()
  let window = null

  const absolute = (path) => (path ? `${root}/${path}` : root)
  const child = (dir, name) => (dir ? `${dir}/${name}` : name)
  const under = (path, dir) => !dir || path === dir || path.startsWith(`${dir}/`)
  const identity = (found) => `${found.ino}:${found.birthtimeMs}`

  const stat = (path) => {
    try {
      return lstatSync(absolute(path))
    } catch {
      return null
    }
  }

  const walk = (dir, visit) => {
    const stack = [dir]

    while (stack.length > 0) {
      const current = stack.pop()
      const found = stat(current)

      if (!found?.isDirectory()) {
        continue
      }

      visit.directory?.(current, found)

      let handle

      try {
        handle = opendirSync(absolute(current))
      } catch {
        continue
      }

      try {
        for (let dirent = handle.readSync(); dirent !== null; dirent = handle.readSync()) {
          if (skipped(dirent.name)) {
            continue
          }

          const path = child(current, dirent.name)

          visit.entry?.(path, dirent.isDirectory())

          if (dirent.isDirectory()) {
            stack.push(path)
          }
        }
      } catch {
        // the directory went away while it was read
      } finally {
        handle.closeSync()
      }
    }
  }

  const index = () => {
    dirs.clear()
    walk('', { directory: (dir, found) => dirs.set(dir, identity(found)) })
  }

  // parcel caches one tree per path, so every other subscription names the root as `root/.` to get a fresh crawl
  const subscribe = async () => {
    const dir = ++generation % 2 ? root : `${root}/.`
    const subscription = { dir, drop: new Set(), options: { ignoreGlobs: [IGNORED], ignorePaths: [`${dir}/.git/subbly-watch-${generation}`] } }

    subscription.listener = (error, list) => received(subscription, error, list)
    await serial(() => parcel.subscribe(dir, subscription.listener, subscription.options))

    return subscription
  }

  const unsubscribe = (subscription) => {
    if (subscription) {
      serial(() => parcel.unsubscribe(subscription.dir, subscription.listener, subscription.options)).catch(() => {})
    }
  }

  const start = async () => {
    try {
      current = await subscribe()
    } catch {
      return false
    }

    if (closed) {
      unsubscribe(current)
      return false
    }

    index()

    return true
  }

  const end = () => {
    unsubscribe(current)
    unsubscribe(previous)
    current = previous = swap = next = null
    lately = new Set()
    clearTimeout(graceTimer)
    clearTimeout(burst?.quiet)
    clearTimeout(burst?.wait)
    burst = null
    dirs.clear()

    if (closed || pollTimer) {
      return
    }

    pollTimer = setInterval(() => {
      if (stat('')?.isDirectory()) {
        clearInterval(pollTimer)
        pollTimer = null
        resume()
      }
    }, rootPoll)
  }

  const resume = async () => {
    if (await start()) {
      restarted()
    } else {
      end()
    }
  }

  const requestSwap = (changes) => {
    if (swap && !swap.ready) {
      merge(swap, changes)
    } else if (swap) {
      next = merge(next ?? { rescan: new Map(), overflow: false }, changes)
    } else {
      swap = merge({ rescan: new Map(), overflow: false }, changes)
      runSwap()
    }
  }

  const merge = (target, { rescan = new Map(), overflow: lost = false }) => {
    for (const [dir, seen] of rescan) {
      target.rescan.set(dir, seen)
    }

    target.overflow ||= lost

    return target
  }

  const runSwap = async () => {
    const replaced = current
    let fresh

    try {
      fresh = await subscribe()
    } catch {
      if (closed || !stat('')?.isDirectory()) {
        end()
        return
      }

      swap.overflow = true
      graceTimer = setTimeout(runSwap, 100)
      return
    }

    if (closed || replaced !== current) {
      unsubscribe(fresh)
      return
    }

    current = fresh
    previous = replaced
    previous.ignored = swap.overflow
    swap.ready = true
    index()

    if (swap.overflow) {
      overflow()
    } else {
      rescan(swap.rescan)
    }

    graceTimer = setTimeout(() => {
      unsubscribe(previous)
      previous = null
      swap = next
      next = null

      if (swap) {
        runSwap()
      }
    }, grace)
  }

  const rescan = (subtrees) => {
    const out = []

    for (const [dir, seen] of subtrees) {
      if (!stat(dir)?.isDirectory()) {
        continue
      }

      const found = new Set()

      walk(dir, {
        entry: (path, directory) => {
          found.add(path)

          if (!seen.has(path)) {
            lately.add(path)
            out.push({ path, op: 'add', entry: directory ? 'directory' : 'file' })
          }
        },
      })

      for (const path of seen) {
        if (!found.has(path)) {
          out.push({ path, op: 'remove' })
        }
      }
    }

    if (out.length > maxEvents) {
      overflow()
    } else if (out.length > 0) {
      events(out)
    }
  }

  const endBurst = () => {
    clearTimeout(burst.quiet)
    clearTimeout(burst.wait)
    burst = null
    requestSwap({ overflow: true })
  }

  const received = (subscription, error, list) => {
    if (closed || (subscription !== current && subscription !== previous) || subscription.ignored) {
      return
    }

    if (error) {
      requestSwap({ overflow: true })
      return
    }

    if (burst) {
      clearTimeout(burst.quiet)
      burst.quiet = setTimeout(endBurst, burstQuiet)
      return
    }

    const now = Date.now()

    if (!window || now - window.last > burstQuiet || now - window.start > burstWait) {
      window = { start: now, last: now, count: 0 }
    }

    window.last = now
    window.count += list.length

    if (window.count > maxEvents) {
      window = null
      burst = { quiet: setTimeout(endBurst, burstQuiet), wait: setTimeout(endBurst, burstWait) }
      return
    }

    const batch = []

    for (const { path, type } of list) {
      if (path !== subscription.dir && !path.startsWith(`${subscription.dir}/`)) {
        continue
      }

      const relative = path.slice(subscription.dir.length + 1)

      if (relative && (relative.split('/').some(skipped) || [...subscription.drop].some((dir) => under(relative, dir)))) {
        continue
      }

      batch.push([relative, type])
    }

    apply(subscription, batch)
  }

  const apply = (subscription, batch) => {
    if (batch.some(([path, type]) => path === '' && type === 'delete')) {
      if (stat('')?.isDirectory()) {
        end()
        clearInterval(pollTimer)
        pollTimer = null
        resume()
        return
      }

      const removes = batch.filter(([path, type]) => path && type === 'delete').map(([path]) => ({ path, op: 'remove' }))

      if (removes.length > 0) {
        events(removes)
      }

      end()
      return
    }

    const earlier = lately
    const reported = new Set(batch.map(([path]) => path))
    const deleted = new Set(batch.filter(([, type]) => type === 'delete').map(([path]) => path))

    lately = new Set()

    for (const path of earlier) {
      if (!reported.has(path) && !stat(path)) {
        batch.push([path, 'delete'])
      }
    }

    const out = []
    const sent = new Set()
    const scanned = new Map()
    let stale = false
    let orphaned = false
    let watched = null

    const add = (path, directory) => {
      sent.add(path)
      out.push({ path, op: 'add', entry: directory ? 'directory' : 'file' })
    }

    const forget = (dir) => {
      for (const path of [...dirs.keys()]) {
        if (under(path, dir)) {
          if (path !== dir && !deleted.has(path)) {
            stale = true
            subscription.drop.add(dir)
          }

          dirs.delete(path)
        }
      }
    }

    const scan = (dir) => {
      const seen = new Set()

      walk(dir, {
        directory: (path, found) => {
          dirs.set(path, identity(found))
          watched ??= watchedInodes()

          if (!watched.has(found.ino)) {
            orphaned = true
          }
        },
        entry: (path, directory) => {
          seen.add(path)

          if (!sent.has(path)) {
            lately.add(path)
            add(path, directory)
          }
        },
      })
      scanned.set(dir, seen)
    }

    for (const [path, type] of batch) {
      if (path && type === 'delete') {
        if (dirs.has(path)) {
          forget(path)
        }

        out.push({ path, op: 'remove' })
      }
    }

    for (const [path, type] of batch) {
      if (!path || type === 'delete' || sent.has(path)) {
        continue
      }

      const found = stat(path)

      if (!found) {
        continue
      }

      const known = dirs.get(path)

      if (type === 'create' && earlier.has(path) && (!found.isDirectory() || known === identity(found))) {
        if (!found.isDirectory()) {
          out.push({ path, op: 'change' })
        }
        continue
      }

      if (!found.isDirectory()) {
        if (known !== undefined) {
          forget(path)
          out.push({ path, op: 'remove' })
          add(path, false)
        } else if (type === 'create') {
          add(path, false)
        } else {
          out.push({ path, op: 'change' })
        }
        continue
      }

      if (known === identity(found)) {
        continue
      }

      if (known !== undefined) {
        forget(path)
      } else if (type === 'update') {
        out.push({ path, op: 'remove' })
      }

      add(path, true)
      scan(path)
    }

    if (out.length > maxEvents) {
      requestSwap({ overflow: true })
      return
    }

    if (out.length > 0) {
      events(out)
    }

    if (stale || orphaned || (swap && !swap.ready && scanned.size > 0)) {
      requestSwap({ rescan: scanned })
    }
  }

  const ready = start().then((started) => {
    if (!started && !closed) {
      end()
    }
  })

  return {
    ready,
    close() {
      closed = true
      clearInterval(pollTimer)
      clearTimeout(graceTimer)
      clearTimeout(burst?.quiet)
      clearTimeout(burst?.wait)
      unsubscribe(current)
      unsubscribe(previous)
    },
  }
}

const inotifyInodes = () => {
  const inodes = new Set()

  for (const fd of readdirSync('/proc/self/fd')) {
    try {
      if (readlinkSync(`/proc/self/fd/${fd}`) !== 'anon_inode:inotify') {
        continue
      }

      for (const match of readFileSync(`/proc/self/fdinfo/${fd}`, 'utf8').matchAll(/^inotify wd:\S+ ino:([0-9a-f]+)/gm)) {
        inodes.add(Number.parseInt(match[1], 16))
      }
    } catch {
      // the descriptor closed while it was read
    }
  }

  return inodes
}
