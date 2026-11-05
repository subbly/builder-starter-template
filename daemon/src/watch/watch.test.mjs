import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { Ring } from './ring.mjs'
import { listen } from '../server/server.mjs'
import { watchedInodes } from '../facts/inotify.mjs'
import { parcel } from './parcel.mjs'
import { watch } from './watch.mjs'
import { watcher } from './watcher.mjs'

const ORIGIN = 'https://builder.subbly.test'
const directory = realpathSync(mkdtempSync(join(tmpdir(), 'daemon-watch-route-')))
const root = join(directory, 'main')
const sandboxIdFile = join(directory, '.E2B_SANDBOX_ID')
const bootIdFile = join(directory, 'boot_id')
const claims = { aud: 'itestsandbox000000001', exp: Math.floor(Date.now() / 1000) + 300 }

mkdirSync(join(root, 'src'), { recursive: true })
writeFileSync(join(root, 'src/page.tsx'), 'x')
writeFileSync(join(root, '.env.local'), 'SECRET=1')
writeFileSync(sandboxIdFile, claims.aud)
writeFileSync(bootIdFile, 'boot-1\n')

let files
const route = watch({
  root,
  sandboxIdFile,
  bootIdFile,
  starts: 7,
  chunk: { maxEntries: 2, maxBytes: 32 * 1024 },
  subscribe: (callbacks) => {
    files = watcher({ root, callbacks, parcel, watchedInodes, limits: { maxEvents: 40, burstQuiet: 100, burstWait: 5000, hold: 2000, grace: 150, rootPoll: 50 } })
  },
})
const server = listen(0, { routes: { '/watch': route }, guard: () => ({ claims }), origins: [ORIGIN] })

await Promise.all([files.ready, once(server, 'listening')])
after(() => {
  server.close()
  files.close()
  rmSync(directory, { recursive: true, force: true })
})

const base = `http://127.0.0.1:${server.address().port}`
const opened = Ring.epoch({ sandboxId: claims.aud, bootId: 'boot-1', starts: 7, generation: 0 })

const attach = async (headers = {}) => {
  const controller = new AbortController()
  const response = await fetch(`${base}/watch`, { headers: { origin: ORIGIN, ...headers }, signal: controller.signal })
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let text = ''

  ;(async () => {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      text += chunk.value
    }
  })().catch(() => {})

  const frames = () => text.split('\n\n').slice(0, -1).filter((event) => event.startsWith('data: ')).map((event) => JSON.parse(event.slice('data: '.length)))

  const until = async (predicate, ms = 3000) => {
    const deadline = Date.now() + ms

    while (Date.now() < deadline) {
      if (predicate(frames())) {
        return frames()
      }
      await new Promise((resolve) => setTimeout(resolve, 20))
    }

    throw new Error(`timed out; frames: ${JSON.stringify(frames()).slice(0, 800)}`)
  }

  return { response, until, frames, text: () => text, close: () => controller.abort() }
}

const count = (frames, type) => frames.filter((frame) => frame.type === type).length
const last = (frames, type) => frames.findLast((frame) => frame.type === type)
const entries = (frames) => frames.filter((frame) => frame.type === 'snapshot').flatMap((frame) => frame.entries)
const events = (frames) => frames.filter((frame) => frame.type === 'watch').flatMap((frame) => frame.events)
const caughtUp = (frames) => count(frames, 'caught-up') > 0

test('a first attach gets a comment, a chunked snapshot with no reset, then caught-up', async () => {
  const stream = await attach()

  try {
    const frames = await stream.until(caughtUp)

    assert.ok(stream.text().startsWith(': open\n\n'))
    assert.equal(stream.response.headers.get('cache-control'), 'no-cache, no-transform')
    assert.equal(stream.response.headers.get('access-control-allow-origin'), ORIGIN)
    assert.equal(count(frames, 'reset'), 0)
    assert.deepEqual(entries(frames).sort((a, b) => a.path.localeCompare(b.path)), [{ path: 'src', entry: 'directory' }, { path: 'src/page.tsx', entry: 'file' }])
    assert.ok(frames.filter((frame) => frame.type === 'snapshot').every((frame) => frame.entries.length <= 2))
    assert.ok(last(frames, 'caught-up').cursor.startsWith(`${opened}.`))
  } finally {
    stream.close()
  }
})

test('live events follow caught-up, and a reconnect resumes from the ring with no snapshot', async () => {
  const stream = await attach()
  let resumeFrom

  try {
    await stream.until(caughtUp)
    mkdirSync(join(root, 'src/empty'))
    writeFileSync(join(root, 'src/live.tsx'), 'x')
    writeFileSync(join(root, '.env.production'), 'SECRET=2')

    const frames = await stream.until((frames) => events(frames).some((event) => event.path === 'src/live.tsx'))

    assert.ok(events(frames).some((event) => event.path === 'src/empty' && event.op === 'add' && event.entry === 'directory'))
    assert.ok(!events(frames).some((event) => event.path.includes('.env')))
    resumeFrom = last(frames, 'watch').cursor
  } finally {
    stream.close()
  }

  writeFileSync(join(root, 'src/while-away.tsx'), 'x')
  await new Promise((resolve) => setTimeout(resolve, 300))

  const again = await attach({ 'last-event-id': resumeFrom })

  try {
    const frames = await again.until(caughtUp)

    assert.equal(count(frames, 'reset'), 0)
    assert.equal(count(frames, 'snapshot'), 0)
    assert.deepEqual(events(frames), [{ path: 'src/while-away.tsx', op: 'add', entry: 'file' }])
    assert.equal(last(frames, 'caught-up').cursor, last(frames, 'watch').cursor)
  } finally {
    again.close()
  }
})

test('a cursor the daemon cannot place resets in-band, then snapshots', async () => {
  for (const [from, reason] of [['garbage', 'unknown'], [Ring.cursor(Ring.epoch({ sandboxId: 'another', bootId: 'boot-1', starts: 7, generation: 0 }), 1), 'restarted'], [Ring.cursor(opened, 99_999), 'unknown']]) {
    const stream = await attach({ 'last-event-id': from })

    try {
      const frames = await stream.until(caughtUp)

      assert.equal(frames[0].type, 'reset')
      assert.equal(frames[0].reason, reason)
      assert.ok(entries(frames).some((entry) => entry.path === 'src/page.tsx'))
    } finally {
      stream.close()
    }
  }
})

test('a burst resets a live reader once with overflow, and the snapshot shows the result', async () => {
  const stream = await attach()

  try {
    await stream.until(caughtUp)

    for (let i = 0; i < 120; i++) {
      writeFileSync(join(root, `src/burst-${i}.ts`), 'x')
    }

    const frames = await stream.until((frames) => count(frames, 'caught-up') === 2)

    assert.equal(count(frames, 'reset'), 1)
    assert.equal(last(frames, 'reset').reason, 'overflow')
    assert.ok(entries(frames).some((entry) => entry.path === 'src/burst-119.ts'))
  } finally {
    stream.close()
  }
})
