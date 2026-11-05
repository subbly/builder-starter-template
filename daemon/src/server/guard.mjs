import { sandboxId } from '../token/sandbox-id.mjs'
import { verdict } from '../token/verdict.mjs'

export function guard({ keyring, sandboxIdFile }) {
  return (request, path) => {
    if (path === '/version') {
      return { claims: null }
    }

    const [scheme, token] = (request.headers.authorization ?? '').split(' ')

    if (scheme !== 'Bearer' || !token) {
      return { reason: 'missing' }
    }

    return verdict(token, { keys: keyring.current(), sandboxId: sandboxId(sandboxIdFile), now: Math.floor(Date.now() / 1000) })
  }
}

