import { opendir } from 'node:fs/promises'
import { skipped } from './paths.mjs'

export const CHUNK_ENTRIES = 500
export const CHUNK_BYTES = 32 * 1024

export async function* snapshot(root, { maxEntries = CHUNK_ENTRIES, maxBytes = CHUNK_BYTES } = {}) {
  const chunk = chunker({ maxEntries, maxBytes })
  const pending = ['']

  while (pending.length > 0) {
    const dir = pending.pop()
    let handle

    try {
      handle = await opendir(dir ? `${root}/${dir}` : root)
    } catch {
      continue
    }

    try {
      for await (const dirent of handle) {
        if (skipped(dirent.name)) {
          continue
        }

        const path = dir ? `${dir}/${dirent.name}` : dirent.name
        const entry = dirent.isDirectory() ? 'directory' : 'file'

        if (entry === 'directory') {
          pending.push(path)
        }

        const full = chunk.push({ path, entry })

        if (full) {
          yield full
        }
      }
    } catch {
      // the directory went away while it was read; its remove follows as an event
    }
  }

  const last = chunk.flush()

  if (last) {
    yield last
  }
}

export function chunker({ maxEntries = CHUNK_ENTRIES, maxBytes = CHUNK_BYTES } = {}) {
  let items = []
  let bytes = 0

  const flush = () => {
    const full = items.length > 0 ? items : null

    items = []
    bytes = 0

    return full
  }

  return {
    push(item) {
      items.push(item)
      bytes += Buffer.byteLength(item.path) + 32

      return items.length >= maxEntries || bytes >= maxBytes ? flush() : null
    },
    flush,
  }
}
