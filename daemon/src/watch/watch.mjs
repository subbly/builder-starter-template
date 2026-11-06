import { eventStream } from '../server/event-stream.mjs'
import { Ring } from './ring.mjs'
import { fileText } from '../facts/file-text.mjs'
import { chunker, snapshot } from './snapshot.mjs'

export function watch({ root, sandboxIdFile, bootIdFile, starts, chunk, subscribe }) {
  let log = Ring.empty()
  let generation = 0
  let wake = signal()

  const notify = () => {
    const woken = wake

    wake = signal()
    woken.resolve()
  }

  subscribe({
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
      log = Ring.empty()
      notify()
    },
  })

  const route = (request, response, claims) => {
    const stream = eventStream(response, claims)
    const identity = { sandboxId: claims?.aud ?? fileText(sandboxIdFile), bootId: fileText(bootIdFile), starts }
    const closed = new Promise((resolve) => response.once('close', resolve))

    follow({ stream, closed, identity, from: request.headers['last-event-id'] ?? null }).catch((error) => {
      console.error(`watch stream failed: ${error.message}`)
      stream.close()
    })
  }

  const follow = async ({ stream, closed, identity, from }) => {
    let at = null

    const resync = async (reason) => {
      const cut = { generation, sequence: log.head(), epoch: Ring.epoch({ ...identity, generation }) }

      if (reason) {
        await stream.deliver({ type: 'reset', reason, cursor: Ring.cursor(cut.epoch, cut.sequence) })
      }

      for await (const entries of snapshot(root, chunk)) {
        if (!stream.isOpen()) {
          return
        }

        await stream.deliver({ type: 'snapshot', entries })
      }

      await stream.deliver({ type: 'caught-up', cursor: Ring.cursor(cut.epoch, cut.sequence) })
      at = cut
    }

    const replay = async (list) => {
      const frames = chunker(chunk)
      let sequence = at.sequence

      const flush = async (events) => {
        if (events) {
          sequence += events.length
          await stream.deliver({ type: 'watch', events, cursor: Ring.cursor(at.epoch, sequence) })
        }
      }

      for (const event of list) {
        await flush(frames.push(event))
      }

      await flush(frames.flush())
      at = { ...at, sequence }
    }

    const opened = Ring.epoch({ ...identity, generation })
    const decision = Ring.decision(from, { epoch: opened, ring: log })

    if (decision.snapshot) {
      await resync(decision.reason)
    } else {
      at = { generation, sequence: log.head() - decision.replay.length, epoch: opened }
      await replay(decision.replay)
      await stream.deliver({ type: 'caught-up', cursor: Ring.cursor(at.epoch, at.sequence) })
    }

    while (stream.isOpen()) {
      if (at.generation !== generation) {
        await resync('restarted')
        continue
      }

      const answer = log.since(at.sequence)

      if (answer.reason) {
        await resync(answer.reason)
      } else if (answer.events.length > 0) {
        await replay(answer.events)
      } else {
        await Promise.race([wake.promise, closed])
      }
    }
  }

  return route
}

const signal = () => {
  let resolve

  const promise = new Promise((done) => {
    resolve = done
  })

  return { promise, resolve }
}
