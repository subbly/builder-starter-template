import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Ring } from './ring.mjs'

const identity = { sandboxId: 'sbx-1', bootId: 'b6f0c7a2-0000-4000-8000-000000000001', starts: 3, generation: 0 }
const current = Ring.epoch(identity)
const events = (count, prefix = 'src/file') => Array.from({ length: count }, (_, i) => ({ path: `${prefix}-${i}.ts`, op: 'change' }))

test('the epoch is stable for one identity and changes with each of its parts', () => {
  assert.equal(Ring.epoch({ ...identity }), current)
  assert.match(current, /^[A-Za-z0-9_-]{16}$/)

  for (const change of [{ sandboxId: 'sbx-2' }, { bootId: 'another-boot' }, { starts: 4 }, { generation: 1 }]) {
    assert.notEqual(Ring.epoch({ ...identity, ...change }), current, JSON.stringify(change))
  }
})

test('a first attach gets a snapshot with no reset', () => {
  assert.deepEqual(Ring.decision(null, { epoch: current, ring: Ring.empty() }), { snapshot: true, reason: null })
  assert.deepEqual(Ring.decision('', { epoch: current, ring: Ring.empty() }), { snapshot: true, reason: null })
})

test('a cursor the daemon cannot read is unknown', () => {
  const log = Ring.empty()

  log.append(events(3))

  for (const text of ['garbage', `${current}`, `${current}.`, `${current}.-1`, `${current}.1.2`, `${current}.1e3`, 'short.1']) {
    assert.deepEqual(Ring.decision(text, { epoch: current, ring: log }), { snapshot: true, reason: 'unknown' }, text)
  }

  assert.deepEqual(Ring.decision(Ring.cursor(current, 4), { epoch: current, ring: log }), { snapshot: true, reason: 'unknown' })
})

test('a cursor from another epoch is restarted', () => {
  const log = Ring.empty()

  log.append(events(3))

  assert.deepEqual(Ring.decision(Ring.cursor(Ring.epoch({ ...identity, starts: 2 }), 1), { epoch: current, ring: log }), { snapshot: true, reason: 'restarted' })
  assert.deepEqual(Ring.decision(Ring.cursor(Ring.epoch({ ...identity, sandboxId: 'sbx-restored' }), 3), { epoch: current, ring: log }), { snapshot: true, reason: 'restarted' })
})

test('a cursor inside the ring replays every event after it', () => {
  const log = Ring.empty()

  assert.equal(log.append(events(2, 'a')), 2)
  assert.equal(log.append(events(3, 'b')), 5)

  assert.deepEqual(Ring.decision(Ring.cursor(current, 0), { epoch: current, ring: log }), { replay: [...events(2, 'a'), ...events(3, 'b')] })
  assert.deepEqual(Ring.decision(Ring.cursor(current, 2), { epoch: current, ring: log }), { replay: events(3, 'b') })
  assert.deepEqual(Ring.decision(Ring.cursor(current, 5), { epoch: current, ring: log }), { replay: [] })
})

test('the ring keeps the last 1,000 events', () => {
  const log = Ring.empty()

  log.append(events(1000))
  assert.equal(log.since(0).events.length, 1000)

  log.append(events(1, 'late'))
  assert.deepEqual(log.since(0), { reason: 'behind' })
  assert.equal(log.since(1).events.length, 1000)
  assert.deepEqual(log.since(1000).events, events(1, 'late'))
})

test('the ring keeps at most 256 KB, whichever limit comes first', () => {
  const log = Ring.empty()
  const long = (i) => ({ path: `src/${'x'.repeat(1000)}-${i}.ts`, op: 'add', entry: 'file' })

  log.append(Array.from({ length: 300 }, (_, i) => long(i)))

  const oldest = Array.from({ length: 301 }, (_, seq) => seq).find((seq) => !log.since(seq).reason)
  const replay = log.since(oldest).events

  assert.deepEqual(log.since(oldest - 1), { reason: 'behind' })
  assert.ok(replay.length > 200 && replay.length < 300, `kept ${replay.length}`)
  assert.ok(replay.reduce((bytes, event) => bytes + Buffer.byteLength(event.path) + 48, 0) <= 256 * 1024)
  assert.deepEqual(replay.at(-1), long(299))
})

test('a burst larger than the ring puts a live reader behind', () => {
  const log = Ring.empty()

  log.append(events(5))

  const reader = log.head()

  log.append(events(4000, 'checkout'))

  assert.deepEqual(Ring.decision(Ring.cursor(current, reader), { epoch: current, ring: log }), { snapshot: true, reason: 'behind' })
  assert.equal(log.since(log.head()).events.length, 0)
})

test('an overflow resets every reader before it, and a snapshot cut after it resumes', () => {
  const log = Ring.empty()

  log.append(events(5))

  const before = log.head()
  const cut = log.overflow()

  assert.deepEqual(Ring.decision(Ring.cursor(current, before), { epoch: current, ring: log }), { snapshot: true, reason: 'overflow' })
  assert.deepEqual(Ring.decision(Ring.cursor(current, 0), { epoch: current, ring: log }), { snapshot: true, reason: 'overflow' })
  assert.deepEqual(Ring.decision(Ring.cursor(current, cut), { epoch: current, ring: log }), { replay: [] })

  log.append(events(2, 'after'))
  assert.deepEqual(Ring.decision(Ring.cursor(current, cut), { epoch: current, ring: log }), { replay: events(2, 'after') })

  log.append(events(1000, 'more'))
  assert.deepEqual(Ring.decision(Ring.cursor(current, cut), { epoch: current, ring: log }), { snapshot: true, reason: 'behind' })
})
