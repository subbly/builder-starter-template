import { readFileSync } from 'node:fs'

export function sandboxId(path) {
  try {
    return readFileSync(path, 'utf8').trim()
  } catch {
    return null
  }
}
