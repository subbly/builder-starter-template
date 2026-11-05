import assert from 'node:assert/strict'
import { once } from 'node:events'
import { appendFileSync, copyFileSync, mkdtempSync, truncateSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { output } from '../bundle/output.mjs'
import { listen } from '../bundle/server.mjs'

const ORIGIN = 'https://builder.subbly.test'
const directory = mkdtempSync(join(tmpdir(), 'daemon-output-route-'))
const path = join(directory, 'output.log')
const sandboxIdFile = join(directory, '.E2B_SANDBOX_ID')
let claims = { aud: 'itestsandbox000000001', exp: Math.floor(Date.now() / 1000) + 300 }
let verdict = () => ({ claims })

writeFileSync(sandboxIdFile, claims.aud)

const server = listen(0, { routes: { '/output': output({ path, sandboxIdFile }) }, guard: () => verdict(), origins: [ORIGIN] })

await once(server, 'listening')
after(() => server.close())

const base = `http://127.0.0.1:${server.address().port}`
const lines = (from, to) => Array.from({ length: to - from + 1 }, (_, index) => `2026-11-05T12:00:00.000: line ${from + index}\n`).join('')

const attach = async (headers = {}) => {
  const controller = new AbortController()
  const response = await fetch(`${base}/output`, { headers: { origin: ORIGIN, ...headers }, signal: controller.signal })
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  const frames = []
  let text = ''
  let isDone = false

  const pump = (async () => {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      text += chunk.value
    }
    isDone = true
  })().catch(() => {
    isDone = true
  })

  const parse = () => {
    const events = text.split('\n\n')
    const whole = events.slice(0, -1)

    frames.length = 0
    for (const event of whole) {
      if (event.startsWith('data: ')) {
        frames.push(JSON.parse(event.slice('data: '.length)))
      }
    }

    return frames
  }

  const until = async (predicate, ms = 3000) => {
    const deadline = Date.now() + ms

    while (Date.now() < deadline) {
      if (predicate(parse())) {
        return frames
      }
      await new Promise((resolve) => setTimeout(resolve, 20))
    }

    throw new Error(`timed out; frames: ${JSON.stringify(parse()).slice(0, 500)}`)
  }

  return { response, until, text: () => text, isDone: () => isDone, close: () => controller.abort(), pump }
}

const texts = (frames) => frames.filter((frame) => frame.type === 'output').flatMap((frame) => frame.lines.map((line) => line.text))
const last = (frames, type) => frames.findLast((frame) => frame.type === type)

test('a preflight from the Builder origin is answered with exact-origin CORS', async () => {
  const response = await fetch(`${base}/output`, { method: 'OPTIONS', headers: { origin: ORIGIN, 'access-control-request-headers': 'authorization, last-event-id' } })

  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN)
  assert.equal(response.headers.get('access-control-allow-headers'), 'Authorization, Last-Event-ID')
  assert.equal(response.headers.get('timing-allow-origin'), ORIGIN)
  assert.equal(response.headers.get('vary'), 'Origin')
})

test('another origin gets no CORS headers', async () => {
  const response = await fetch(`${base}/output`, { method: 'OPTIONS', headers: { origin: 'https://evil.example' } })

  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), null)
})

test('a refused token still answers with CORS, so the browser can read the 401', async () => {
  verdict = () => ({ reason: 'expired' })

  try {
    const response = await fetch(`${base}/output`, { headers: { origin: ORIGIN } })

    assert.equal(response.status, 401)
    assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN)
  } finally {
    verdict = () => ({ claims })
  }
})

test('a first attach gets a comment at once, then the replay, then caught-up', async () => {
  writeFileSync(path, lines(1, 5))
  const stream = await attach()

  try {
    const frames = await stream.until((frames) => last(frames, 'caught-up'))

    assert.ok(stream.text().startsWith(': open\n\n'))
    assert.equal(stream.response.headers.get('cache-control'), 'no-cache, no-transform')
    assert.equal(stream.response.headers.get('access-control-allow-origin'), ORIGIN)
    assert.deepEqual(texts(frames), ['line 1', 'line 2', 'line 3', 'line 4', 'line 5'])
    assert.equal(last(frames, 'caught-up').cursor, last(frames, 'output').cursor)
  } finally {
    stream.close()
  }
})

test('the follower reads every line once across a rotation', async () => {
  writeFileSync(path, lines(1, 2))
  const stream = await attach()

  try {
    await stream.until((frames) => last(frames, 'caught-up'))
    appendFileSync(path, lines(3, 4))
    await stream.until((frames) => texts(frames).includes('line 4'))
    appendFileSync(path, lines(5, 6))
    copyFileSync(path, join(directory, 'output__2026-11-05_12-30-00.log'))
    truncateSync(path, 0)
    appendFileSync(path, lines(7, 8))
    const frames = await stream.until((frames) => texts(frames).includes('line 8'))

    assert.deepEqual(texts(frames), ['line 1', 'line 2', 'line 3', 'line 4', 'line 5', 'line 6', 'line 7', 'line 8'])
    assert.equal(frames.filter((frame) => frame.type === 'reset').length, 0)
  } finally {
    stream.close()
  }
})

test('a resume from Last-Event-ID repeats nothing and misses nothing', async () => {
  writeFileSync(path, lines(1, 3))
  const first = await attach()
  const cursor = last(await first.until((frames) => last(frames, 'caught-up')), 'caught-up').cursor

  first.close()
  appendFileSync(path, lines(4, 5))
  const resumed = await attach({ 'last-event-id': cursor })

  try {
    const frames = await resumed.until((frames) => last(frames, 'caught-up'))

    assert.deepEqual(texts(frames), ['line 4', 'line 5'])
    assert.equal(frames.filter((frame) => frame.type === 'reset').length, 0)
  } finally {
    resumed.close()
  }
})

test('a cursor the daemon cannot honour gets a reset in-band, then the tail, and the stream stays open', async () => {
  writeFileSync(path, lines(1, 3))
  const stream = await attach({ 'last-event-id': 'garbage' })

  try {
    const frames = await stream.until((frames) => last(frames, 'caught-up'))

    assert.equal(frames[0].type, 'reset')
    assert.equal(frames[0].reason, 'unknown')
    assert.deepEqual(texts(frames), ['line 1', 'line 2', 'line 3'])
    appendFileSync(path, lines(4, 4))
    await stream.until((frames) => texts(frames).includes('line 4'))
  } finally {
    stream.close()
  }
})

test('the stream ends with an expired frame at the token exp', async () => {
  writeFileSync(path, lines(1, 1))
  claims = { ...claims, exp: Math.floor(Date.now() / 1000) + 1 }

  try {
    const stream = await attach()
    const frames = await stream.until((frames) => last(frames, 'expired'), 3000)

    await stream.pump
    assert.equal(frames.at(-1).type, 'expired')
    assert.ok(last(frames, 'caught-up'))
    assert.equal(stream.isDone(), true)
  } finally {
    claims = { ...claims, exp: Math.floor(Date.now() / 1000) + 300 }
  }
})
