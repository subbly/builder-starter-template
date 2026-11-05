import { createHash } from 'node:crypto'
import { closeSync, fstatSync, openSync, readSync, readdirSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

export const REPLAY_BYTES = 64 * 1024
export const BEHIND_BYTES = 256 * 1024
export const NONE = 'none'

const CHUNK_BYTES = 32 * 1024
const LINE_BYTES = 8 * 1024
const FRAME_LINES = 256
const CHECK_BYTES = 256
const HEAD_BYTES = 64 * 1024
const NEWLINE = 0x0a
const STAMP = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}): ?/
const CURSOR = /^(none|[0-9a-f]{16})\.(\d{1,15})\.([0-9a-f]{16}|0)$/

export function segments(path, sandboxId) {
  const directory = dirname(path)
  const prefix = `${basename(path, '.log')}__`
  const archives = entries(directory)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.log'))
    .sort()
    .map((name) => segment(join(directory, name), sandboxId))
    .filter((archive) => archive !== null)

  return [...archives, segment(path, sandboxId) ?? { path, size: 0, epoch: NONE }]
}

export function cursor({ epoch, offset, check }) {
  return `${epoch}.${offset}.${check}`
}

export function position(text) {
  const match = CURSOR.exec(text ?? '')

  if (!match) {
    return null
  }

  return { epoch: match[1], offset: Number(match[2]), check: match[3] }
}

export function locate({ at, files, behindBytes }) {
  const current = files.length - 1

  if (!at) {
    return { reset: 'unknown' }
  }

  if (at.epoch === NONE) {
    return within({ files, index: current, offset: 0, behindBytes })
  }

  const index = files.findLastIndex((file) => file.epoch === at.epoch)

  if (index === -1) {
    return { reset: current > 0 ? 'rotated' : 'unknown' }
  }

  const file = files[index]

  if (index < current && at.offset >= file.size) {
    return within({ files, index: index + 1, offset: 0, behindBytes })
  }

  if (at.offset > file.size) {
    return { reset: 'truncated' }
  }

  if (check(file.path, at.offset) !== at.check) {
    return { reset: 'truncated' }
  }

  return within({ files, index, offset: at.offset, behindBytes })
}

export function tail(files, bytes) {
  const index = files.findLastIndex((_, candidate) => remaining(files, candidate) >= bytes)

  if (index === -1) {
    return { index: 0, offset: 0 }
  }

  const file = files[index]
  const start = remaining(files, index) - bytes

  if (start === 0) {
    return { index, offset: 0 }
  }

  const end = nextNewline(file.path, start - 1)

  if (end !== -1) {
    return { index, offset: end + 1 }
  }

  if (index < files.length - 1) {
    return { index: index + 1, offset: 0 }
  }

  return { index, offset: previousNewline(file.path, start) + 1 }
}

export function read(file, offset) {
  const start = Math.max(0, offset - CHECK_BYTES)
  const head = offset - start
  const buffer = Buffer.alloc(head + CHUNK_BYTES)
  const length = bytes(file.path, buffer, start)
  const data = buffer.subarray(head, Math.max(head, length))
  const lines = []
  let consumed = 0

  while (lines.length < FRAME_LINES) {
    const end = data.indexOf(NEWLINE, consumed)

    if (end === -1) {
      break
    }

    lines.push(line(data.subarray(consumed, end)))
    consumed = end + 1
  }

  if (lines.length > 0) {
    const next = offset + consumed

    return { lines, offset: next, check: digest(buffer.subarray(Math.max(0, next - CHECK_BYTES) - start, next - start)) }
  }

  const end = data.length < CHUNK_BYTES ? -1 : nextNewline(file.path, offset + CHUNK_BYTES)

  if (end === -1) {
    return { lines }
  }

  return { lines: [line(data.subarray(0, end - offset))], offset: end + 1, check: check(file.path, end + 1) }
}

export function check(path, offset) {
  if (offset === 0) {
    return '0'
  }

  const start = Math.max(0, offset - CHECK_BYTES)
  const buffer = Buffer.alloc(offset - start)

  if (bytes(path, buffer, start) < buffer.length || buffer[buffer.length - 1] !== NEWLINE) {
    return null
  }

  return digest(buffer)
}

const within = ({ files, index, offset, behindBytes }) => {
  return remaining(files, index) - offset > behindBytes ? { reset: 'behind' } : { index, offset }
}

const remaining = (files, index) => files.slice(index).reduce((sum, file) => sum + file.size, 0)

const line = (raw) => {
  const isTruncated = raw.length > LINE_BYTES
  const text = raw.subarray(0, LINE_BYTES).toString('utf8')
  const stamp = STAMP.exec(text)
  const ts = stamp ? Date.parse(`${stamp[1]}Z`) : null

  return {
    ts: Number.isNaN(ts) ? null : ts,
    text: stamp ? text.slice(stamp[0].length) : text,
    ...(isTruncated ? { truncated: true } : {}),
  }
}

const segment = (path, sandboxId) => {
  const fd = descriptor(path)

  if (fd === null) {
    return null
  }

  try {
    const size = fstatSync(fd).size
    const head = Buffer.alloc(Math.min(size, HEAD_BYTES))
    const length = readSync(fd, head, 0, head.length, 0)
    const end = head.subarray(0, length).indexOf(NEWLINE)
    const first = end === -1 && length === HEAD_BYTES ? head : head.subarray(0, end)

    return { path, size, epoch: end === -1 && length < HEAD_BYTES ? NONE : digest(Buffer.concat([Buffer.from(`${sandboxId}\0`), first])) }
  } finally {
    closeSync(fd)
  }
}

const nextNewline = (path, from) => {
  const buffer = Buffer.alloc(CHUNK_BYTES)

  for (let start = from; ; start += CHUNK_BYTES) {
    const length = bytes(path, buffer, start)
    const end = buffer.subarray(0, length).indexOf(NEWLINE)

    if (end !== -1) {
      return start + end
    }

    if (length < CHUNK_BYTES) {
      return -1
    }
  }
}

const previousNewline = (path, before) => {
  for (let end = before; end > 0; end -= CHUNK_BYTES) {
    const start = Math.max(0, end - CHUNK_BYTES)
    const buffer = Buffer.alloc(end - start)
    const found = buffer.subarray(0, bytes(path, buffer, start)).lastIndexOf(NEWLINE)

    if (found !== -1) {
      return start + found
    }
  }

  return -1
}

const bytes = (path, buffer, position) => {
  const fd = descriptor(path)

  if (fd === null) {
    return 0
  }

  try {
    return readSync(fd, buffer, 0, buffer.length, position)
  } finally {
    closeSync(fd)
  }
}

const descriptor = (path) => {
  try {
    return openSync(path, 'r')
  } catch {
    return null
  }
}

const entries = (directory) => {
  try {
    return readdirSync(directory)
  } catch {
    return []
  }
}

const digest = (buffer) => createHash('sha256').update(buffer).digest('hex').slice(0, 16)
