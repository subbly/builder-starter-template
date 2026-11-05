import { createPublicKey } from 'node:crypto'
import { readFileSync } from 'node:fs'

export function keys(text) {
  const file = JSON.parse(text)

  if (typeof file?.iss !== 'string' || !Array.isArray(file.keys) || file.keys.length > 2) {
    throw new Error('a key file is { iss, keys } with at most two keys')
  }

  const byKid = new Map(file.keys.map((jwk) => [jwk.kid, publicKey(jwk)]))

  if (byKid.size !== file.keys.length || byKid.has(undefined)) {
    throw new Error('every key has its own kid')
  }

  return { iss: file.iss, byKid }
}

export function keyring(path) {
  let current = { iss: null, byKid: new Map() }

  const reload = () => {
    try {
      current = keys(readFileSync(path, 'utf8'))
      console.log(`keys ${[...current.byKid.keys()].join(', ') || '(none)'} for ${current.iss}`)
    } catch (error) {
      console.error(`kept the previous keys, ${path} did not load: ${error.message}`)
    }
  }

  reload()

  return { current: () => current, reload }
}

const publicKey = (jwk) => {
  const key = createPublicKey({ key: { kty: jwk.kty, crv: jwk.crv, x: jwk.x }, format: 'jwk' })

  if (key.asymmetricKeyType !== 'ed25519') {
    throw new Error(`key ${jwk.kid} is not Ed25519`)
  }

  return key
}
