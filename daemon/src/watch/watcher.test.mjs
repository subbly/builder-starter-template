import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { lstatSync } from 'node:fs'
import { watcher as watch } from './watcher.mjs'

const base = realpathSync(mkdtempSync(join(tmpdir(), 'daemon-watch-')))
let roots = 0

after(() => rmSync(base, { recursive: true, force: true }))

const timing = { burstQuiet: 100, burstWait: 1000, grace: 150, rootPoll: 50 }

const start = async (options = {}) => {
  const root = join(base, `root-${roots++}`)
  const seen = { events: [], overflows: 0, restarts: 0 }

  mkdirSync(root)

  const watcher = watch(root, {
    events: (list) => seen.events.push(...list),
    overflow: () => seen.overflows++,
    restarted: () => seen.restarts++,
  }, { ...timing, ...options })

  await watcher.ready

  const write = (path, content = 'x') => {
    mkdirSync(join(root, path, '..'), { recursive: true })
    writeFileSync(join(root, path), content)
  }

  return { root, seen, watcher, write, path: (path) => join(root, path) }
}

const until = async (check, what, timeout = 3000) => {
  const deadline = Date.now() + timeout

  while (!check()) {
    if (Date.now() > deadline) {
      assert.fail(`timed out waiting for ${what}`)
    }

    await sleep(10)
  }
}

const settle = () => sleep(250)
const has = (events, path, op, entry) => events.some((event) => event.path === path && event.op === op && (entry === undefined || event.entry === entry))

const inotifyWatches = () =>
  readdirSync('/proc/self/fd').reduce((count, fd) => {
    try {
      return readlinkSync(`/proc/self/fd/${fd}`) === 'anon_inode:inotify' ? count + readFileSync(`/proc/self/fdinfo/${fd}`, 'utf8').split('\n').filter((line) => line.startsWith('inotify wd:')).length : count
    } catch {
      return count
    }
  }, 0)

test('a new empty folder shows as a folder', async () => {
  const { seen, watcher, path } = await start()

  try {
    mkdirSync(path('empty'))
    await until(() => has(seen.events, 'empty', 'add', 'directory'), 'the folder add')
  } finally {
    watcher.close()
  }
})

test('the new-directory scan sends every add in a deep new tree, and its directories stay watched', async () => {
  const { seen, watcher, write } = await start()
  const count = 200

  try {
    for (let i = 0; i < count; i++) {
      write(`d${i}/x/y/z/early.txt`)
    }

    await settle()

    for (let i = 0; i < count; i++) {
      write(`d${i}/x/y/z/late.txt`)
    }

    await until(() => seen.events.filter((event) => event.path.endsWith('/late.txt')).length >= count, 'every late add')

    for (let i = 0; i < count; i++) {
      for (const dir of [`d${i}`, `d${i}/x`, `d${i}/x/y`, `d${i}/x/y/z`]) {
        assert.ok(has(seen.events, dir, 'add', 'directory'), dir)
      }

      assert.ok(has(seen.events, `d${i}/x/y/z/early.txt`, 'add', 'file'), `d${i} early`)
      assert.ok(has(seen.events, `d${i}/x/y/z/late.txt`, 'add', 'file'), `d${i} late`)
    }

  } finally {
    watcher.close()
  }
})

test('edits, renames and deletes map to change, add and remove', async () => {
  const { seen, watcher, write, path } = await start()

  try {
    write('src/page.tsx')
    write('src/ui/button.tsx')
    await until(() => has(seen.events, 'src/ui/button.tsx', 'add', 'file'), 'the first adds')
    await settle()

    seen.events.length = 0
    writeFileSync(path('src/page.tsx'), 'edited')
    await until(() => seen.events.length > 0, 'the edit')
    assert.deepEqual(seen.events, [{ path: 'src/page.tsx', op: 'change' }])

    seen.events.length = 0
    renameSync(path('src/page.tsx'), path('src/home.tsx'))
    await until(() => seen.events.length >= 2, 'the rename')
    assert.deepEqual(seen.events, [{ path: 'src/page.tsx', op: 'remove' }, { path: 'src/home.tsx', op: 'add', entry: 'file' }])

    seen.events.length = 0
    rmSync(path('src'), { recursive: true })
    await until(() => has(seen.events, 'src', 'remove'), 'the tree delete')
    await settle()

    for (const removed of ['src/home.tsx', 'src/ui/button.tsx', 'src/ui', 'src']) {
      assert.ok(has(seen.events, removed, 'remove'), removed)
    }

    assert.ok(seen.events.every((event) => event.op === 'remove' && !('entry' in event)))
  } finally {
    watcher.close()
  }
})

test('a renamed folder reports its children under the new name, and later edits too', async () => {
  const { seen, watcher, write, path } = await start()

  try {
    write('src/components/ui/button.tsx')
    await until(() => has(seen.events, 'src/components/ui/button.tsx', 'add'), 'the first add')

    seen.events.length = 0
    renameSync(path('src/components'), path('src/widgets'))
    await until(() => has(seen.events, 'src/widgets/ui/button.tsx', 'add', 'file'), 'the renamed children')
    assert.ok(has(seen.events, 'src/components', 'remove'))
    assert.ok(has(seen.events, 'src/widgets', 'add', 'directory'))
    assert.ok(has(seen.events, 'src/widgets/ui', 'add', 'directory'))

    seen.events.length = 0
    writeFileSync(path('src/widgets/ui/button.tsx'), 'edited')
    await until(() => seen.events.length > 0, 'the edit after the rename')
    await settle()
    assert.deepEqual(seen.events, [{ path: 'src/widgets/ui/button.tsx', op: 'change' }])

    seen.events.length = 0
    mkdirSync(path('src/widgets/ui/icons'))
    writeFileSync(path('src/widgets/ui/icons/star.svg'), 'x')
    await until(() => has(seen.events, 'src/widgets/ui/icons/star.svg', 'add', 'file'), 'an add in a new folder after the rename')
    await settle()
    assert.ok(seen.events.every((event) => event.path.startsWith('src/widgets/')), JSON.stringify(seen.events))
  } finally {
    watcher.close()
  }
})

test('a folder renamed right after it was made keeps reporting under its new name', async () => {
  const { seen, watcher, write, path } = await start()

  try {
    write('src/fresh/inner/a.ts')
    await until(() => has(seen.events, 'src/fresh/inner/a.ts', 'add'), 'the first adds')
    seen.events.length = 0
    renameSync(path('src/fresh'), path('src/moved'))
    await until(() => has(seen.events, 'src/moved/inner/a.ts', 'add'), 'the renamed adds')
    await sleep(300)

    writeFileSync(path('src/moved/inner/b.ts'), 'x')
    await until(() => has(seen.events, 'src/moved/inner/b.ts', 'add', 'file'), 'a write after the rename')
    assert.ok(!seen.events.some((event) => event.path.startsWith('src/fresh/') && event.op !== 'remove'))
  } finally {
    watcher.close()
  }
})

test('a burst sliced into small batches still counts as one burst', async () => {
  const { seen, watcher, write } = await start({ maxEvents: 50 })

  try {
    for (let round = 0; round < 4; round++) {
      for (let i = 0; i < 20; i++) {
        write(`slices/round-${round}/file-${i}.ts`)
      }

      await sleep(80)
    }

    await until(() => seen.overflows > 0, 'the overflow')
    await settle()
    assert.equal(seen.overflows, 1)
  } finally {
    watcher.close()
  }
})

test('a tree moved in from outside is scanned and watched', async () => {
  const { seen, watcher, path } = await start()
  const outside = join(base, 'outside')

  try {
    mkdirSync(join(outside, 'pkg/deep'), { recursive: true })
    writeFileSync(join(outside, 'pkg/deep/f.txt'), 'x')
    renameSync(join(outside, 'pkg'), path('pkg'))
    await until(() => has(seen.events, 'pkg/deep/f.txt', 'add', 'file'), 'the moved-in tree')

    writeFileSync(path('pkg/deep/g.txt'), 'x')
    await until(() => has(seen.events, 'pkg/deep/g.txt', 'add', 'file'), 'a write inside the moved-in tree')
  } finally {
    watcher.close()
    rmSync(outside, { recursive: true, force: true })
  }
})

test('a tree moved out reports one remove, then nothing, and its watches go away', async () => {
  const { seen, watcher, write, path } = await start()
  const outside = join(base, 'moved-out')
  const before = inotifyWatches()

  try {
    write('lib/deep/inner/f.ts')
    await until(() => has(seen.events, 'lib/deep/inner/f.ts', 'add'), 'the first adds')
    await settle()

    seen.events.length = 0
    renameSync(path('lib'), outside)
    await until(() => has(seen.events, 'lib', 'remove'), 'the remove')
    await settle()

    writeFileSync(join(outside, 'deep/inner/f.ts'), 'edited')
    writeFileSync(join(outside, 'deep/inner/g.ts'), 'new')
    await settle()

    assert.deepEqual(seen.events, [{ path: 'lib', op: 'remove' }])
    assert.ok(inotifyWatches() <= before + 1, 'parcel keeps the kernel watch of the moved folder itself, and only that one')
  } finally {
    watcher.close()
    rmSync(outside, { recursive: true, force: true })
  }
})

test('never-watched trees cost no watch, and secret files are never reported', async () => {
  const { seen, watcher, write } = await start()
  const before = inotifyWatches()

  try {
    for (const file of ['node_modules/react/index.js', 'node_modules/react/cjs/a.js', '.next/cache/webpack/x', '.git/objects/ab/cd', 'packages/ui/node_modules/x/index.js', '.env.local', '.env', 'certs/server.pem', 'certs/server.key', '.npmrc', 'src/app/page.tsx']) {
      write(file)
    }

    await until(() => has(seen.events, 'src/app/page.tsx', 'add'), 'the reported add')
    await settle()

    assert.deepEqual(seen.events.map((event) => event.path).sort(), ['certs', 'packages', 'packages/ui', 'src', 'src/app', 'src/app/page.tsx'])
    assert.equal(inotifyWatches() - before, 5)
  } finally {
    watcher.close()
  }
})

test('a burst over the batch cap is one overflow, and the watch goes on', async () => {
  const { seen, watcher, write } = await start({ maxEvents: 50 })

  try {
    for (let i = 0; i < 300; i++) {
      write(`checkout/dir-${i % 10}/file-${i}.ts`)
    }

    await until(() => seen.overflows > 0, 'the overflow')
    await settle()
    assert.equal(seen.overflows, 1)
    assert.equal(seen.events.length, 0)

    write('checkout/dir-3/after.ts')
    await until(() => seen.events.length > 0, 'the edit after the burst')
    assert.deepEqual(seen.events, [{ path: 'checkout/dir-3/after.ts', op: 'add', entry: 'file' }])
  } finally {
    watcher.close()
  }
})

test('a removed root ends the watch until it returns, then restarts it', async () => {
  const { root, seen, watcher, write } = await start()

  try {
    write('src/page.tsx')
    await until(() => has(seen.events, 'src/page.tsx', 'add'), 'the first add')

    rmSync(root, { recursive: true })
    await until(() => has(seen.events, 'src', 'remove'), 'the removes before the end')
    await settle()
    assert.equal(seen.restarts, 0)

    seen.events.length = 0
    mkdirSync(root)
    await until(() => seen.restarts === 1, 'the restart')

    write('src/back.tsx')
    await until(() => has(seen.events, 'src/back.tsx', 'add', 'file'), 'an add after the restart')

    rmSync(root, { recursive: true })
    mkdirSync(root)
    write('swapped.txt')
    await until(() => seen.restarts === 2, 'the restart after a swap')
    assert.ok(!seen.events.some((event) => event.path === '' || event.path === 'swapped.txt'))
  } finally {
    watcher.close()
  }
})

test('a scanned folder renamed before parcel reports its children still swaps out the stale watches', async () => {
  const root = join(base, 'scripted')
  const subscriptions = []
  const parcel = {
    subscribe: async (dir, listener) => subscriptions.push({ dir, listener }),
    unsubscribe: async () => {},
  }
  const seen = []

  mkdirSync(join(root, 'src'), { recursive: true })

  let watched = new Set([lstatSync(root).ino, lstatSync(join(root, 'src')).ino])

  const watcher = watch(root, { events: (list) => seen.push(...list), overflow: () => {}, restarted: () => {} }, { ...timing, parcel, watchedInodes: () => watched })

  try {
    await watcher.ready
    const [{ dir, listener }] = subscriptions

    mkdirSync(join(root, 'src/x/y'), { recursive: true })
    writeFileSync(join(root, 'src/x/y/a.ts'), '1')
    watched = new Set([lstatSync(join(root, 'src/x')).ino, lstatSync(join(root, 'src/x/y')).ino])

    listener(null, [{ path: `${dir}/src/x`, type: 'create' }])
    assert.deepEqual(seen.map((event) => event.path), ['src/x', 'src/x/y', 'src/x/y/a.ts'])

    renameSync(join(root, 'src/x'), join(root, 'src/renamed'))
    listener(null, [{ path: `${dir}/src/renamed`, type: 'create' }, { path: `${dir}/src/x`, type: 'delete' }])
    await until(() => subscriptions.length === 2, 'the swap to a fresh subscription')

    assert.ok(has(seen, 'src/x', 'remove'))
    assert.ok(has(seen, 'src/renamed/y/a.ts', 'add', 'file'))
  } finally {
    watcher.close()
  }
})

const scripted = async (name) => {
  const root = join(base, name)
  const subscriptions = []
  const pending = []
  const parcel = {
    subscribe: async (dir, listener) => {
      subscriptions.push({ dir, listener })

      if (subscriptions.length > 1) {
        await new Promise((resolve) => pending.push(resolve))
      }
    },
    unsubscribe: async () => {},
  }
  const seen = []

  mkdirSync(join(root, 'src'), { recursive: true })

  const state = { watched: new Set([lstatSync(root).ino, lstatSync(join(root, 'src')).ino]) }

  const watcher = watch(root, { events: (list) => seen.push(...list), overflow: () => {}, restarted: () => {} }, { ...timing, parcel, watchedInodes: () => state.watched })

  await watcher.ready

  const inodes = (...paths) => paths.map((path) => lstatSync(join(root, path)).ino)
  const release = async () => {
    await until(() => pending.length > 0, 'a fresh subscription')
    pending.shift()()
    await sleep(10)
  }

  return { root, subscriptions, seen, state, watcher, inodes, release, path: (path) => join(root, path) }
}

test('the new-directory scan reports a folder made while the watch swaps subscriptions', async () => {
  const { subscriptions, seen, state, watcher, inodes, release, path } = await scripted('swap-made')

  try {
    const [{ dir, listener }] = subscriptions

    mkdirSync(path('src/x/y'), { recursive: true })
    state.watched = new Set(inodes('src/x'))
    listener(null, [{ path: `${dir}/src/x`, type: 'create' }])

    mkdirSync(path('src/many/1/inner'), { recursive: true })
    writeFileSync(path('src/many/1/inner/f.txt'), 'x')
    state.watched = new Set(inodes('src/x', 'src/x/y', 'src/many', 'src/many/1', 'src/many/1/inner'))
    await release()

    listener(null, [{ path: `${dir}/src/many`, type: 'create' }])
    await until(() => has(seen, 'src/many/1/inner/f.txt', 'add', 'file'), 'the adds under the folder made during the swap', 1000)

    for (const folder of ['src/many', 'src/many/1', 'src/many/1/inner']) {
      assert.ok(has(seen, folder, 'add', 'directory'), folder)
    }
  } finally {
    watcher.close()
  }
})

test('a folder the fresh subscription missed is found by the swap scan and watched by another swap', async () => {
  const { subscriptions, seen, state, watcher, inodes, release, path } = await scripted('swap-missed')

  try {
    const [{ dir, listener }] = subscriptions

    mkdirSync(path('src/x/y'), { recursive: true })
    state.watched = new Set(inodes('src/x'))
    listener(null, [{ path: `${dir}/src/x`, type: 'create' }])

    mkdirSync(path('src/x/y/late'))
    state.watched = new Set(inodes('src/x', 'src/x/y'))
    await release()

    assert.ok(has(seen, 'src/x/y/late', 'add', 'directory'))
    await until(() => subscriptions.length === 3, 'a swap that watches the missed folder', 1000)

    writeFileSync(path('src/x/y/late/after.txt'), 'x')
    state.watched = new Set(inodes('src/x', 'src/x/y', 'src/x/y/late'))
    await release()
    assert.ok(has(seen, 'src/x/y/late/after.txt', 'add', 'file'))
  } finally {
    watcher.close()
  }
})
