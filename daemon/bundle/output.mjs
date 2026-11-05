import { statSync } from 'node:fs'
import { eventStream } from './event-stream.mjs'
import { BEHIND_BYTES, REPLAY_BYTES, check, cursor, locate, position, read, segments, tail } from './output-log.mjs'
import { sandboxId } from './sandbox-id.mjs'

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
    const start = tail(files, REPLAY_BYTES)
    const file = files[start.index]

    at = { epoch: file.epoch, offset: start.offset, check: check(file.path, start.offset) }
    isReplay = true

    if (reason) {
      events.send({ type: 'reset', reason, cursor: cursor(at) })
    }
  }

  const first = segments(path, sandboxId)

  if (from === null) {
    replayTail(first, null)
  } else {
    const found = locate({ at: position(from), files: first, behindBytes: BEHIND_BYTES })

    if (found.reset) {
      replayTail(first, found.reset)
    } else {
      at = { epoch: first[found.index].epoch, offset: found.offset, check: found.offset === 0 ? '0' : position(from).check }
    }
  }

  while (events.isOpen()) {
    const seen = stamp(path)
    const files = segments(path, sandboxId)
    const found = locate({ at, files, behindBytes: Infinity })

    if (found.reset) {
      replayTail(files, found.reset)
      await sleep()
      continue
    }

    const file = files[found.index]
    const chunk = read(file, found.offset)

    if (chunk.lines.length > 0) {
      at = { epoch: file.epoch, offset: chunk.offset, check: chunk.check }

      if (!events.send({ type: 'output', lines: chunk.lines, cursor: cursor(at) })) {
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
      events.send({ type: 'caught-up', cursor: cursor(at) })
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
