import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { keyring, keys } from '../bundle/keys.mjs'
import { verify } from '../bundle/token.mjs'

const vectors = JSON.parse(readFileSync(new URL('./token-vectors.json', import.meta.url), 'utf8'))
const [first, second] = vectors.mints
const [slotA, slotB] = vectors.keyFile.keys
const environment = (name) => JSON.parse(readFileSync(new URL(`../keys/${name}.json`, import.meta.url), 'utf8'))
const reason = (ring, mint) => verify(mint.token, { keys: ring.current(), sandboxId: mint.sandboxId, now: mint.now }).reason ?? null

test('a key file with a third key is refused', () => {
  assert.throws(() => keys(JSON.stringify({ iss: 'subbly-builder-test', keys: [slotA, slotB, { ...slotA, kid: 'test-c' }] })))
})

test('a key file with a repeated kid is refused', () => {
  assert.throws(() => keys(JSON.stringify({ iss: 'subbly-builder-test', keys: [slotA, { ...slotB, kid: slotA.kid }] })))
})

test('a key that is not Ed25519 is refused', () => {
  assert.throws(() => keys(JSON.stringify({ iss: 'subbly-builder-test', keys: [{ ...slotA, crv: 'X25519' }] })))
})

test('a reload moves the daemon to the new kid in two steps, with no restart', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'daemon-keys-')), 'daemon-keys.json')

  writeFileSync(path, JSON.stringify({ iss: vectors.keyFile.iss, keys: [slotA] }))
  const ring = keyring(path)

  assert.equal(reason(ring, first), null)
  assert.equal(reason(ring, second), 'kid')

  writeFileSync(path, JSON.stringify({ iss: vectors.keyFile.iss, keys: [slotA, slotB] }))
  ring.reload()

  assert.equal(reason(ring, first), null)
  assert.equal(reason(ring, second), null)

  writeFileSync(path, JSON.stringify({ iss: vectors.keyFile.iss, keys: [slotB] }))
  ring.reload()

  assert.equal(reason(ring, first), 'kid')
  assert.equal(reason(ring, second), null)
})

test('a broken key file keeps the keys already loaded', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'daemon-keys-')), 'daemon-keys.json')

  writeFileSync(path, JSON.stringify(vectors.keyFile))
  const ring = keyring(path)

  writeFileSync(path, '{ "iss": ')
  ring.reload()

  assert.equal(reason(ring, first), null)
})

test('a missing key file refuses every token', () => {
  const ring = keyring(join(tmpdir(), 'no-such-daemon-keys.json'))

  assert.equal(reason(ring, first), 'kid')
})

test('the dev and production key files share no issuer and no key', () => {
  const dev = keys(JSON.stringify(environment('dev')))
  const production = keys(JSON.stringify(environment('production')))
  const devKeys = environment('dev').keys.map((key) => key.x)

  assert.notEqual(dev.iss, production.iss)
  assert.equal(environment('production').keys.filter((key) => devKeys.includes(key.x) || dev.byKid.has(key.kid)).length, 0)
})
