export * as Ring from './ring.mjs'

import { createHash } from 'node:crypto'

const RING_EVENTS = 1000
const RING_BYTES = 256 * 1024

export function epoch({ sandboxId, bootId, starts, generation }) {
  return createHash('sha256').update([sandboxId, bootId, starts, generation].join('\n')).digest('base64url').slice(0, 16)
}

export function cursor(epoch, seq) {
  return `${epoch}.${seq}`
}

export function empty({ maxEvents = RING_EVENTS, maxBytes = RING_BYTES } = {}) {
  let events = []
  let bytes = 0
  let head = 0
  let overflowAt = 0

  return {
    head: () => head,

    append(batch) {
      for (const event of batch) {
        events.push(event)
        bytes += size(event)
      }

      head += batch.length

      let drop = Math.max(0, events.length - maxEvents)

      for (let i = 0; i < drop; i++) {
        bytes -= size(events[i])
      }

      while (bytes > maxBytes) {
        bytes -= size(events[drop++])
      }

      if (drop > 0) {
        events = events.slice(drop)
      }

      return head
    },

    overflow() {
      events = []
      bytes = 0
      head += 1
      overflowAt = head

      return head
    },

    since(seq) {
      if (!Number.isSafeInteger(seq) || seq < 0 || seq > head) {
        return { reason: 'unknown' }
      }

      const first = head - events.length + 1

      if (seq < first - 1) {
        return { reason: seq < overflowAt ? 'overflow' : 'behind' }
      }

      return { events: events.slice(seq - first + 1) }
    },
  }
}

export function decision(text, { epoch, ring }) {
  if (!text) {
    return { snapshot: true, reason: null }
  }

  const match = /^([A-Za-z0-9_-]{16})\.(\d{1,15})$/.exec(text)

  if (!match) {
    return { snapshot: true, reason: 'unknown' }
  }

  if (match[1] !== epoch) {
    return { snapshot: true, reason: 'restarted' }
  }

  const answer = ring.since(Number(match[2]))

  return answer.reason ? { snapshot: true, reason: answer.reason } : { replay: answer.events }
}

const size = (event) => Buffer.byteLength(event.path) + 48
