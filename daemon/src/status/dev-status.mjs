import { eventStream } from '../server/event-stream.mjs'
import { Status } from './status.mjs'

export function devStatus({ pm2, probe, holder, bootId }, timing) {
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

  const lifeNow = () => Status.frame({ processes: processes ?? null, listening: false, listener: holder(), bootId }).life

  const publish = () => {
    if (processes === undefined || listening === undefined) {
      return
    }

    const next = Status.frame({ processes, listening, listener: holder(), bootId })

    if (next.listening && next.life !== probedLife) {
      next.listening = false
      probeNow()
    }

    if (frame && Status.isSame(frame, next)) {
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
