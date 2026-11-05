import { createHash } from 'node:crypto'
import { DEV_APP } from './contract.mjs'

const STATES = {
  launching: 'starting',
  'waiting restart': 'starting',
  online: 'online',
  stopping: 'stopped',
  stopped: 'stopped',
  'one-launch-status': 'stopped',
  errored: 'errored',
}

export function devState(processes) {
  const app = processes.find((process) => process.name === DEV_APP)

  if (!app) {
    return { state: 'missing', pid: null }
  }

  return { state: STATES[app.status] ?? 'errored', pid: app.pid || null }
}

export function life(bootId, pid) {
  return createHash('sha256').update(`${bootId}\0${pid ?? 0}`).digest('hex').slice(0, 16)
}

export function statusFrame({ processes, listening, listener, bootId }) {
  const { state, pid } = processes ? devState(processes) : { state: 'missing', pid: null }

  return { type: 'status', state, life: life(bootId, listener ?? pid), listening, supervisor: processes ? 'up' : 'down' }
}

export function sameStatus(a, b) {
  return a.state === b.state && a.life === b.life && a.listening === b.listening && a.supervisor === b.supervisor
}
