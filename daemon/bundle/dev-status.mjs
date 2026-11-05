import { readFileSync } from 'node:fs'
import { BOOT_ID, DEV_PORT, DEV_PROBE, PM2_BIN, PM2_RPC } from './contract.mjs'
import { eventStream } from './event-stream.mjs'
import { pm2Rpc } from './pm2.mjs'
import { answers, portHolder } from './port.mjs'
import { sameStatus, statusFrame } from './status.mjs'

export const TIMING = { poll: 1000, waiting: 500, listening: 2000, linger: 10_000 }

export function sandboxDevStatus() {
  return devStatus({
    pm2: pm2Rpc({ bin: PM2_BIN, socket: PM2_RPC, timeout: 3000 }),
    probe: () => answers({ port: DEV_PORT, path: DEV_PROBE, timeout: 2000 }),
    holder: portHolder(DEV_PORT),
    bootId: readFileSync(BOOT_ID, 'utf8').trim(),
  })
}

// Polls only while someone listens, and for `linger` after the last one leaves, so an `expired` reconnect gets the frame at once.
// `listening` holds only for the life it was probed under: a new life reads false until a fresh probe answers.
export function devStatus({ pm2, probe, holder, bootId }, timing = TIMING) {
  const listeners = new Set()
  let run = 0
  let running = false
  let processes
  let listening
  let frame = null
  let pollTimer
  let probeTimer
  let lingerTimer
  let probing = 0
  let probedLife = null

  const lifeNow = () => statusFrame({ processes: processes ?? null, listening: false, listener: holder(), bootId }).life

  const publish = () => {
    if (processes === undefined || listening === undefined) {
      return
    }

    const next = statusFrame({ processes, listening, listener: holder(), bootId })

    if (next.listening && next.life !== probedLife) {
      next.listening = false
      probeNow()
    }

    if (frame && sameStatus(frame, next)) {
      return
    }

    frame = next

    for (const listener of listeners) {
      listener(frame)
    }
  }

  const poll = async (at) => {
    const list = await pm2.processes()

    if (at !== run) {
      return
    }

    processes = list
    publish()
    pollTimer = setTimeout(() => poll(at), timing.poll)
  }

  const check = async (at) => {
    probing = at
    const life = lifeNow()
    const answered = await probe()

    if (probing === at) {
      probing = 0
    }

    if (at !== run) {
      return
    }

    listening = answered
    probedLife = life
    publish()

    if (!probing) {
      probeTimer = setTimeout(() => check(at), answered ? timing.listening : timing.waiting)
    }
  }

  const probeNow = () => {
    if (probing !== run) {
      clearTimeout(probeTimer)
      check(run)
    }
  }

  const start = () => {
    run += 1
    running = true
    processes = undefined
    listening = undefined
    probedLife = null
    frame = null
    poll(run)
    check(run)
  }

  const stop = () => {
    run += 1
    running = false
    clearTimeout(pollTimer)
    clearTimeout(probeTimer)
    pm2.close()
  }

  return {
    subscribe(listener) {
      clearTimeout(lingerTimer)
      listeners.add(listener)

      if (!running) {
        start()
      } else if (frame) {
        listener(frame)
      }

      return () => {
        if (listeners.delete(listener) && listeners.size === 0) {
          lingerTimer = setTimeout(stop, timing.linger)
        }
      }
    },
    current: () => frame,
  }
}

export function statusRoute(status) {
  return (_request, response, claims) => {
    const events = eventStream(response, claims)
    const unsubscribe = status.subscribe((frame) => {
      if (events.isOpen()) {
        events.send(frame)
      }
    })

    response.on('close', unsubscribe)
  }
}
