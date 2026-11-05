import assert from 'node:assert/strict'
import { test } from 'node:test'
import { devState, life, sameStatus, statusFrame } from '../bundle/status.mjs'

const bootId = '6f1c2a9e-3b4d-4e5f-8a7b-9c0d1e2f3a4b'
const list = (status, pid = 1896) => [
  { name: 'pm2-logrotate', pid: 8013, status: 'online' },
  { name: 'subbly-dev', pid, status },
  { name: 'css-watcher', pid: 1901, status: 'online' },
]

test('every pm2 state maps to a dev server state', () => {
  const cases = [
    ['launching', 'starting'],
    ['waiting restart', 'starting'],
    ['online', 'online'],
    ['stopping', 'stopped'],
    ['stopped', 'stopped'],
    ['one-launch-status', 'stopped'],
    ['errored', 'errored'],
  ]

  for (const [status, state] of cases) {
    assert.equal(devState(list(status)).state, state, status)
  }
})

test('a pm2 state this daemon does not know reads as errored', () => {
  assert.equal(devState(list('paused')).state, 'errored')
})

test('no subbly-dev in the process list is missing', () => {
  assert.deepEqual(devState(list('online').filter((process) => process.name !== 'subbly-dev')), { state: 'missing', pid: null })
  assert.deepEqual(devState([]), { state: 'missing', pid: null })
})

test('a stopped app has no pid', () => {
  assert.equal(devState(list('stopped', 0)).pid, null)
  assert.equal(devState(list('online')).pid, 1896)
})

test('life is stable for the same boot and pid, and changes with either', () => {
  assert.equal(life(bootId, 1979), life(bootId, 1979))
  assert.match(life(bootId, 1979), /^[0-9a-f]{16}$/)
  assert.notEqual(life(bootId, 1979), life(bootId, 2423))
  assert.notEqual(life(bootId, 1979), life('0a1b2c3d-0000-4000-8000-000000000000', 1979))
  assert.equal(life(bootId, null), life(bootId, 0))
})

test('life follows the pid that holds the port, and falls back to pm2 when nothing listens', () => {
  const onPort = statusFrame({ processes: list('online'), listening: true, listener: 1979, bootId })
  const nextRestart = statusFrame({ processes: list('online'), listening: true, listener: 2423, bootId })
  const portDown = statusFrame({ processes: list('online'), listening: false, listener: null, bootId })

  assert.equal(onPort.life, life(bootId, 1979))
  assert.notEqual(nextRestart.life, onPort.life)
  assert.equal(portDown.life, life(bootId, 1896))
})

test('a pm2 restart changes life even before the port opens', () => {
  const before = statusFrame({ processes: list('online', 1896), listening: false, listener: null, bootId })
  const after = statusFrame({ processes: list('online', 2210), listening: false, listener: null, bootId })

  assert.notEqual(after.life, before.life)
})

test('a dead pm2 reads as supervisor down and missing, and an orphan on the port keeps its life', () => {
  const frame = statusFrame({ processes: null, listening: false, listener: 8169, bootId })

  assert.deepEqual(frame, { type: 'status', state: 'missing', life: life(bootId, 8169), listening: false, supervisor: 'down' })
})

test('a full frame carries state, life, listening and supervisor', () => {
  assert.deepEqual(statusFrame({ processes: list('online'), listening: true, listener: 1979, bootId }), {
    type: 'status',
    state: 'online',
    life: life(bootId, 1979),
    listening: true,
    supervisor: 'up',
  })
})

test('a frame equal to the last one is the same status', () => {
  const frame = statusFrame({ processes: list('online'), listening: true, listener: 1979, bootId })

  assert.equal(sameStatus(frame, statusFrame({ processes: list('online'), listening: true, listener: 1979, bootId })), true)
  assert.equal(sameStatus(frame, statusFrame({ processes: list('online'), listening: false, listener: 1979, bootId })), false)
  assert.equal(sameStatus(frame, statusFrame({ processes: list('waiting restart', 0), listening: true, listener: 1979, bootId })), false)
  assert.equal(sameStatus(frame, statusFrame({ processes: null, listening: true, listener: 1979, bootId })), false)
})
