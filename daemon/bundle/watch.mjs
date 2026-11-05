import { readFileSync } from 'node:fs'
import { eventStream } from './event-stream.mjs'
import { cursor, epoch, resume, ring } from './ring.mjs'
import { sandboxId } from './sandbox-id.mjs'
import { chunker, snapshot } from './snapshot.mjs'
import { watcher } from './watcher.mjs'

export function watch({ root, sandboxIdFile, bootIdFile, starts, options = {} }) {
  let log = ring()
  let generation = 0
  let wake = signal()

  const notify = () => {
    const woken = wake

    wake = signal()
    woken.resolve()
  }

  const subscription = watcher(root, {
    events: (list) => {
      log.append(list)
      notify()
    },
    overflow: () => {
      log.overflow()
      notify()
    },
    restarted: () => {
      generation++
      log = ring()
      notify()
    },
  }, options)

  const route = (request, response, claims) => {
    const stream = eventStream(response, claims)
    const identity = { sandboxId: claims?.aud ?? sandboxId(sandboxIdFile), bootId: text(bootIdFile), starts }
    const closed = new Promise((resolve) => response.once('close', resolve))

    follow({ stream, closed, identity, from: request.headers['last-event-id'] ?? null }).catch((error) => {
      console.error(`watch stream failed: ${error.message}`)
      stream.close()
    })
  }

  const follow = async ({ stream, closed, identity, from }) => {
    const send = async (frame) => {
      if (!stream.send(frame)) {
        await stream.drained()
      }
    }

    let at = null

    const resync = async (reason) => {
      const cut = { generation, seq: log.head(), epoch: epoch({ ...identity, generation }) }

      if (reason) {
        await send({ type: 'reset', reason, cursor: cursor(cut.epoch, cut.seq) })
      }

      for await (const entries of snapshot(root, options)) {
        if (!stream.isOpen()) {
          return
        }

        await send({ type: 'snapshot', entries })
      }

      await send({ type: 'caught-up', cursor: cursor(cut.epoch, cut.seq) })
      at = cut
    }

    const replay = async (list) => {
      const frames = chunker(options)
      let seq = at.seq

      const flush = async (events) => {
        if (events) {
          seq += events.length
          await send({ type: 'watch', events, cursor: cursor(at.epoch, seq) })
        }
      }

      for (const event of list) {
        await flush(frames.push(event))
      }

      await flush(frames.flush())
      at = { ...at, seq }
    }

    const opened = epoch({ ...identity, generation })
    const decision = resume(from, { epoch: opened, ring: log })

    if (decision.snapshot) {
      await resync(decision.reason)
    } else {
      at = { generation, seq: log.head() - decision.replay.length, epoch: opened }
      await replay(decision.replay)
      await send({ type: 'caught-up', cursor: cursor(at.epoch, at.seq) })
    }

    while (stream.isOpen()) {
      if (at.generation !== generation) {
        await resync('restarted')
        continue
      }

      const answer = log.since(at.seq)

      if (answer.reason) {
        await resync(answer.reason)
      } else if (answer.events.length > 0) {
        await replay(answer.events)
      } else {
        await Promise.race([wake.promise, closed])
      }
    }
  }

  route.close = () => subscription.close()
  route.ready = subscription.ready

  return route
}

const signal = () => {
  let resolve

  const promise = new Promise((done) => {
    resolve = done
  })

  return { promise, resolve }
}

const text = (path) => {
  try {
    return readFileSync(path, 'utf8').trim()
  } catch {
    return ''
  }
}
