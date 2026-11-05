import { readFileSync } from 'node:fs'
import { verify } from './token.mjs'

export function guard({ keyring, sandboxIdFile }) {
  return (request, path) => {
    if (path === '/version') {
      return { claims: null }
    }

    const [scheme, token] = (request.headers.authorization ?? '').split(' ')

    if (scheme !== 'Bearer' || !token) {
      return { reason: 'missing' }
    }

    return verify(token, { keys: keyring.current(), sandboxId: sandboxId(sandboxIdFile), now: Math.floor(Date.now() / 1000) })
  }
}

const sandboxId = (path) => {
  try {
    return readFileSync(path, 'utf8').trim()
  } catch {
    return null
  }
}
