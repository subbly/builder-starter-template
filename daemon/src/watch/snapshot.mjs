import { opendir } from 'node:fs/promises'
import { Paths } from './paths.mjs'

export async function* snapshot(root, limits) {
  const chunk = chunker(limits)
  const pending = ['']

  while (pending.length > 0) {
    const folder = pending.pop()
    let handle

    try {
      handle = await opendir(folder ? `${root}/${folder}` : root)
    } catch {
      continue
    }

    try {
      for await (const dirent of handle) {
        if (Paths.isSkipped(dirent.name)) {
          continue
        }

        const path = folder ? `${folder}/${dirent.name}` : dirent.name
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
    }
  }

  const last = chunk.flush()

  if (last) {
    yield last
  }
}

export function chunker({ maxEntries, maxBytes }) {
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
