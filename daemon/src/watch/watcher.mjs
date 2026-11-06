import { lstatSync, opendirSync } from 'node:fs'
import { Paths } from './paths.mjs'

let queue = Promise.resolve()
const serial = (call) => (queue = queue.then(call, call))

export function watcher({ root, callbacks, parcel, watchedInodes, limits }) {
  const { events, overflow, restarted } = callbacks
  const { maxEvents, burstQuiet, burstWait, hold, grace, rootPoll } = limits
  const folders = new Map()
  let generation = 0
  let current = null
  let previous = null
  let swap = null
  let next = null
  let burst = null
  let pollTimer = null
  let graceTimer = null
  let isClosed = false
  let scanAdds = new Set()
  let burstWindow = null
  let isDiscarding = false

  const absolute = (path) => (path ? `${root}/${path}` : root)
  const child = (folder, name) => (folder ? `${folder}/${name}` : name)
  const under = (path, folder) => !folder || path === folder || path.startsWith(`${folder}/`)
  const identity = (found) => `${found.ino}:${found.birthtimeMs}`

  const stat = (path) => {
    try {
      return lstatSync(absolute(path))
    } catch {
      return null
    }
  }

  const walk = (folder, visit) => {
    const stack = [folder]

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
          if (Paths.isSkipped(dirent.name)) {
            continue
          }

          const path = child(current, dirent.name)

          visit.entry?.(path, dirent.isDirectory())

          if (dirent.isDirectory()) {
            stack.push(path)
          }
        }
      } catch {
      } finally {
        handle.closeSync()
      }
    }
  }

  const read = (folder, entry) => {
    let watched = null
    let hasUnwatched = false

    walk(folder, {
      directory: (path, found) => {
        folders.set(path, identity(found))
        watched ??= new Set(watchedInodes())

        if (!watched.has(found.ino)) {
          hasUnwatched = true
        }
      },
      entry,
    })

    return hasUnwatched
  }

  const index = () => {
    const found = new Set()

    folders.clear()

    if (read('', (path) => found.add(path))) {
      requestSwap({ rescan: new Map([['', found]]) })
    }
  }

  const subscribe = async () => {
    const folder = ++generation % 2 ? root : `${root}/.`
    const subscription = { folder, drop: new Set(), options: { ignoreGlobs: [Paths.IGNORE_PATTERN], ignorePaths: [`${folder}/.git/subbly-watch-${generation}`] } }

    subscription.listener = (error, list) => received(subscription, error, list)
    await serial(() => parcel.subscribe(folder, subscription.listener, subscription.options))

    return subscription
  }

  const unsubscribe = (subscription) => {
    if (subscription) {
      serial(() => parcel.unsubscribe(subscription.folder, subscription.listener, subscription.options)).catch(() => {})
    }
  }

  const start = async () => {
    try {
      current = await subscribe()
    } catch {
      return false
    }

    if (isClosed) {
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
    scanAdds = new Set()
    clearTimeout(graceTimer)
    clearTimeout(burst?.quiet)
    clearTimeout(burst?.wait)
    burst = null

    if (burstWindow && !isDiscarding && burstWindow.held.length > 0) {
      events(burstWindow.held)
    }

    clearTimeout(burstWindow?.quiet)
    clearTimeout(burstWindow?.hold)
    burstWindow = null
    isDiscarding = false
    folders.clear()

    if (isClosed || pollTimer) {
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
    if (changes.overflow) {
      lose()
    }

    if (swap && !swap.isReady) {
      merge(swap, changes)
    } else if (swap) {
      next = merge(next ?? { rescan: new Map(), overflow: false }, changes)
    } else {
      swap = merge({ rescan: new Map(), overflow: false }, changes)
      runSwap()
    }
  }

  const merge = (target, { rescan = new Map(), overflow = false }) => {
    for (const [folder, seen] of rescan) {
      target.rescan.set(folder, seen)
    }

    target.overflow ||= overflow

    return target
  }

  const runSwap = async () => {
    const replaced = current
    let fresh

    try {
      fresh = await subscribe()
    } catch {
      if (isClosed || !stat('')?.isDirectory()) {
        end()
        return
      }

      swap.overflow = true
      lose()
      graceTimer = setTimeout(runSwap, 100)
      return
    }

    if (isClosed || replaced !== current) {
      unsubscribe(fresh)
      return
    }

    current = fresh
    previous = replaced
    previous.isIgnored = swap.overflow
    swap.isReady = true

    if (swap.overflow) {
      index()
      reset()
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
    const missed = new Map()

    for (const [folder, seen] of subtrees) {
      if (!stat(folder)?.isDirectory()) {
        continue
      }

      const found = new Set()
      const hasUnwatched = read(folder, (path, isDirectory) => {
        found.add(path)

        if (!seen.has(path)) {
          scanAdds.add(path)
          out.push({ path, op: 'add', entry: isDirectory ? 'directory' : 'file' })
        }
      })

      for (const path of seen) {
        if (!found.has(path)) {
          folders.delete(path)
          out.push({ path, op: 'remove' })
        }
      }

      if (hasUnwatched) {
        missed.set(folder, found)
      }
    }

    if (out.length > maxEvents) {
      reset()
    } else {
      send(out)
    }

    if (missed.size > 0) {
      requestSwap({ rescan: missed })
    }
  }

  const send = (out) => {
    if (isDiscarding || out.length === 0) {
      return
    }

    if (burstWindow) {
      burstWindow.held.push(...out)
    } else {
      events(out)
    }
  }

  const release = () => {
    if (!burstWindow) {
      return
    }

    const { held } = burstWindow

    clearTimeout(burstWindow.quiet)
    clearTimeout(burstWindow.hold)
    burstWindow = null

    if (held.length > maxEvents) {
      requestSwap({ overflow: true })
    } else if (held.length > 0) {
      events(held)
    }
  }

  const lose = () => {
    isDiscarding = true

    if (burstWindow) {
      burstWindow.held = []
    }
  }

  const reset = () => {
    if (burstWindow) {
      burstWindow.held = []
    }

    isDiscarding = false
    overflow()
  }

  const endBurst = () => {
    clearTimeout(burst.quiet)
    clearTimeout(burst.wait)
    burst = null
    requestSwap({ overflow: true })
  }

  const received = (subscription, error, list) => {
    if (isClosed || (subscription !== current && subscription !== previous) || subscription.isIgnored) {
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

    burstWindow ??= { count: 0, held: [], hold: setTimeout(release, hold) }
    clearTimeout(burstWindow.quiet)
    burstWindow.quiet = setTimeout(release, burstQuiet)
    burstWindow.count += list.length

    if (burstWindow.count > maxEvents) {
      lose()
      clearTimeout(burstWindow.quiet)
      clearTimeout(burstWindow.hold)
      burstWindow = null
      burst = { quiet: setTimeout(endBurst, burstQuiet), wait: setTimeout(endBurst, burstWait) }
      return
    }

    const batch = []

    for (const { path, type } of list) {
      if (path !== subscription.folder && !path.startsWith(`${subscription.folder}/`)) {
        continue
      }

      const relative = path.slice(subscription.folder.length + 1)

      if (relative && (Paths.isSkippedPath(relative) || [...subscription.drop].some((folder) => under(relative, folder)))) {
        continue
      }

      batch.push([relative, type])
    }

    apply(subscription, batch)
  }

  const apply = (subscription, batch) => {
    const isRootDeleted = batch.some(([path, type]) => path === '' && type === 'delete')

    if (isRootDeleted && stat('')?.isDirectory()) {
      end()
      clearInterval(pollTimer)
      pollTimer = null
      resume()
      return
    }

    if (isRootDeleted) {
      send(batch.filter(([path, type]) => path && type === 'delete').map(([path]) => ({ path, op: 'remove' })))
      end()
      return
    }

    const earlier = scanAdds
    const reported = new Set(batch.map(([path]) => path))
    const deleted = new Set(batch.filter(([, type]) => type === 'delete').map(([path]) => path))

    scanAdds = new Set()

    for (const path of earlier) {
      if (!reported.has(path) && !stat(path)) {
        batch.push([path, 'delete'])
      }
    }

    const out = []
    const sent = new Set()
    const scanned = new Map()
    let isStale = false
    let hasUnwatched = false

    const add = (path, isDirectory) => {
      sent.add(path)
      out.push({ path, op: 'add', entry: isDirectory ? 'directory' : 'file' })
    }

    const forget = (folder) => {
      for (const path of [...folders.keys()].filter((path) => under(path, folder))) {
        if (path !== folder && !deleted.has(path)) {
          isStale = true
          subscription.drop.add(folder)
        }

        folders.delete(path)
      }
    }

    const scan = (folder) => {
      const seen = new Set()

      hasUnwatched = read(folder, (path, isDirectory) => {
        seen.add(path)

        if (!sent.has(path)) {
          scanAdds.add(path)
          add(path, isDirectory)
        }
      }) || hasUnwatched
      scanned.set(folder, seen)
    }

    for (const [path] of batch.filter(([path, type]) => path && type === 'delete')) {
      if (folders.has(path)) {
        forget(path)
      }

      out.push({ path, op: 'remove' })
    }

    for (const [path, type] of batch) {
      if (!path || type === 'delete' || sent.has(path)) {
        continue
      }

      const found = stat(path)

      if (!found) {
        continue
      }

      const known = folders.get(path)
      const isFolder = found.isDirectory()
      const isScanAdd = type === 'create' && earlier.has(path)

      if (isScanAdd && isFolder && known === identity(found)) {
        continue
      }

      if (isScanAdd && !isFolder) {
        out.push({ path, op: 'change' })
        continue
      }

      if (!isFolder && known !== undefined) {
        forget(path)
        out.push({ path, op: 'remove' })
        add(path, false)
        continue
      }

      if (!isFolder && type === 'create') {
        add(path, false)
        continue
      }

      if (!isFolder) {
        out.push({ path, op: 'change' })
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

    send(out)

    if (isStale || hasUnwatched || (swap && !swap.isReady && scanned.size > 0)) {
      requestSwap({ rescan: scanned })
    }
  }

  const ready = start().then((started) => {
    if (!started && !isClosed) {
      end()
    }
  })

  return {
    ready,
    close() {
      isClosed = true
      clearInterval(pollTimer)
      clearTimeout(graceTimer)
      clearTimeout(burst?.quiet)
      clearTimeout(burst?.wait)
      clearTimeout(burstWindow?.quiet)
      clearTimeout(burstWindow?.hold)
      unsubscribe(current)
      unsubscribe(previous)
    },
  }
}
