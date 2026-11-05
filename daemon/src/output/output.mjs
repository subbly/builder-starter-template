import { statSync } from 'node:fs'
import { eventStream } from '../server/event-stream.mjs'
import { OutputLog } from './output-log.mjs'
import { sandboxId } from '../token/sandbox-id.mjs'

const POLL_MS = 200

export function output({ path, sandboxIdFile }) {
  return (request, response, claims) => {
    const events = eventStream(response, claims)

    follow({ events, path, sandboxId: claims?.aud ?? sandboxId(sandboxIdFile), from: request.headers['last-event-id'] ?? null }).catch((error) => {
      console.error(`output stream failed: ${error.message}`)
      events.close()
    })
  }
}

const follow = async ({ events, path, sandboxId, from }) => {
  let at = null
  let isReplay = true

  const replayTail = (files, reason) => {
    const start = OutputLog.tail(files, OutputLog.REPLAY_BYTES)
    const file = files[start.index]

    at = { epoch: file.epoch, offset: start.offset, check: OutputLog.check(file.path, start.offset) }
    isReplay = true

    if (reason) {
      events.send({ type: 'reset', reason, cursor: OutputLog.cursor(at) })
    }
  }

  const first = OutputLog.segments(path, sandboxId)

  if (from === null) {
    replayTail(first, null)
  } else {
    const found = OutputLog.location({ at: OutputLog.position(from), files: first, behindBytes: OutputLog.BEHIND_BYTES })

    if (found.reset) {
      replayTail(first, found.reset)
    } else {
      at = { epoch: first[found.index].epoch, offset: found.offset, check: found.offset === 0 ? '0' : OutputLog.position(from).check }
    }
  }

  while (events.isOpen()) {
    const seen = stamp(path)
    const files = OutputLog.segments(path, sandboxId)
    const found = OutputLog.location({ at, files, behindBytes: Infinity })

    if (found.reset) {
      replayTail(files, found.reset)
      await sleep()
      continue
    }

    const file = files[found.index]
    const chunk = OutputLog.chunk(file, found.offset)

    if (chunk.records.length > 0) {
      at = { epoch: file.epoch, offset: chunk.offset, check: chunk.check }

      if (!events.send({ type: 'output', records: chunk.records, cursor: OutputLog.cursor(at) })) {
        await events.drained()
      }

      continue
    }

    if (found.index < files.length - 1) {
      at = { epoch: files[found.index + 1].epoch, offset: 0, check: '0' }
      continue
    }

    at = { epoch: file.epoch, offset: found.offset, check: found.offset === 0 ? '0' : at.check }

    if (isReplay) {
      isReplay = false
      events.send({ type: 'caught-up', cursor: OutputLog.cursor(at) })
    }

    while (events.isOpen() && stamp(path) === seen) {
      await sleep()
    }
  }
}

const sleep = () => new Promise((resolve) => setTimeout(resolve, POLL_MS))

const stamp = (path) => {
  try {
    const { size, mtimeMs } = statSync(path)

    return `${size}:${mtimeMs}`
  } catch {
    return 'missing'
  }
}
