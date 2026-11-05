import assert from 'node:assert/strict'
import { once } from 'node:events'
import { setTimeout as sleep } from 'node:timers/promises'
import { test } from 'node:test'
import { devStatus, statusRoute } from '../bundle/dev-status.mjs'
import { listen } from '../bundle/server.mjs'
import { life } from '../bundle/status.mjs'

const timing = { poll: 10, waiting: 5, listening: 10, linger: 30 }

const sources = () => {
  const world = { processes: [{ name: 'subbly-dev', pid: 1896, status: 'online' }], listening: true, listener: 1979, closes: 0, calls: 0 }
  const pm2 = {
    processes: async () => {
      world.calls += 1
      return world.processes
    },
    close: () => {
      world.closes += 1
    },
  }

  return { world, sources: { pm2, probe: async () => world.listening, holder: () => world.listener, bootId: 'boot' } }
}

test('the first frame waits for pm2 and the probe, and an unchanged state sends nothing more', async () => {
  const { sources: given } = sources()
  const status = devStatus(given, timing)
  const frames = []
  const unsubscribe = status.subscribe((frame) => frames.push(frame))

  assert.equal(frames.length, 0)
  await sleep(80)
  unsubscribe()

  assert.equal(frames.length, 1)
  assert.equal(frames[0].state, 'online')
  assert.equal(frames[0].listening, true)
  assert.equal(frames[0].supervisor, 'up')
})

test('a change in any field sends one new full frame', async () => {
  const { world, sources: given } = sources()
  const status = devStatus(given, timing)
  const frames = []
  const unsubscribe = status.subscribe((frame) => frames.push(frame))

  await sleep(40)
  world.listener = 2423
  await sleep(40)
  world.processes = null
  await sleep(40)
  unsubscribe()

  assert.deepEqual(
    frames.map((frame) => [frame.life === frames[0].life ? 'old' : 'new', frame.listening, frame.supervisor]),
    [
      ['old', true, 'up'],
      ['new', false, 'up'],
      ['new', true, 'up'],
      ['new', true, 'down'],
    ],
  )
})

test('a reader that attaches later gets the current frame at once', async () => {
  const { sources: given } = sources()
  const status = devStatus(given, timing)
  const first = status.subscribe(() => {})

  await sleep(40)
  const frames = []
  const second = status.subscribe((frame) => frames.push(frame))

  assert.equal(frames.length, 1)
  assert.deepEqual(frames[0], status.current())
  first()
  second()
})

test('an expired reconnect inside the linger gets the same frame, and polling stops after it', async () => {
  const { world, sources: given } = sources()
  const status = devStatus(given, timing)
  const before = []
  const after = []

  const first = status.subscribe((frame) => before.push(frame))

  await sleep(40)
  first()
  await sleep(10)
  const unsubscribe = status.subscribe((frame) => after.push(frame))

  unsubscribe()
  assert.equal(before.length, 1)
  assert.deepEqual(after, before)
  await sleep(80)
  const calls = world.calls

  assert.equal(world.closes, 1)
  await sleep(40)
  assert.equal(world.calls, calls)
})

test('a new life reads not listening until a fresh probe answers under it', async () => {
  const { world, sources: given } = sources()
  const status = devStatus(given, { ...timing, listening: 1000 })
  const frames = []
  const unsubscribe = status.subscribe((frame) => frames.push(frame))

  await sleep(30)
  world.listener = 2423
  await sleep(30)
  unsubscribe()

  assert.deepEqual(
    frames.map((frame) => [frame.life === frames[0].life ? 'old' : 'new', frame.listening]),
    [
      ['old', true],
      ['new', false],
      ['new', true],
    ],
  )
})

test('/status sends the open comment, then the full frame, with CORS, and stops polling after the reader leaves', async () => {
  const origin = 'https://builder.subbly.test'
  const { world, sources: given } = sources()
  const server = listen(0, { routes: { '/status': statusRoute(devStatus(given, timing)) }, guard: () => ({ claims: { exp: Math.floor(Date.now() / 1000) + 300 } }), origins: [origin] })

  await once(server, 'listening')

  const controller = new AbortController()
  const response = await fetch(`http://127.0.0.1:${server.address().port}/status`, { headers: { origin }, signal: controller.signal })
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let text = ''

  while (!text.includes('data: ')) {
    text += (await reader.read()).value
  }

  while (!text.endsWith('\n\n')) {
    text += (await reader.read()).value
  }

  assert.equal(response.headers.get('content-type'), 'text/event-stream')
  assert.equal(response.headers.get('cache-control'), 'no-cache, no-transform')
  assert.equal(response.headers.get('access-control-allow-origin'), origin)
  assert.ok(text.startsWith(': open\n\n'))
  assert.deepEqual(JSON.parse(text.split('data: ')[1]), { type: 'status', state: 'online', life: life('boot', 1979), listening: true, supervisor: 'up' })

  controller.abort()
  await sleep(timing.linger + 40)
  const calls = world.calls

  await sleep(40)
  assert.equal(world.calls, calls)
  assert.equal(world.closes, 1)
  server.close()
})
