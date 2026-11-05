import { verify as verifySignature } from 'node:crypto'

export const LEEWAY = 30

export function verify(token, { keys, sandboxId, now }) {
  const parts = token.split('.')
  const [header, claims] = parts.slice(0, 2).map(decoded)

  if (parts.length !== 3 || !header || !claims) {
    return { reason: 'malformed' }
  }

  if (header.alg !== 'EdDSA' || header.typ !== 'sandbox-daemon+jwt') {
    return { reason: 'header' }
  }

  const key = keys.byKid.get(header.kid)

  if (!key) {
    return { reason: 'kid' }
  }

  if (!verifySignature(null, Buffer.from(`${parts[0]}.${parts[1]}`), key, Buffer.from(parts[2], 'base64url'))) {
    return { reason: 'signature' }
  }

  if (claims.iss !== keys.iss) {
    return { reason: 'issuer' }
  }

  if (typeof claims.aud !== 'string' || claims.aud !== sandboxId) {
    return { reason: 'audience' }
  }

  if (typeof claims.scope !== 'string' || !claims.scope.split(' ').includes('streams:read')) {
    return { reason: 'scope' }
  }

  if (!Number.isInteger(claims.exp) || now > claims.exp + LEEWAY) {
    return { reason: 'expired' }
  }

  if (!Number.isInteger(claims.iat) || claims.iat > now + LEEWAY) {
    return { reason: 'early' }
  }

  return { claims }
}

const decoded = (part) => {
  try {
    const value = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'))

    return value !== null && typeof value === 'object' ? value : null
  } catch {
    return null
  }
}
