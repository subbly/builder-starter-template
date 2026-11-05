import assert from 'node:assert/strict'
import { createPrivateKey, sign } from 'node:crypto'
import { once } from 'node:events'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { guard } from '../bundle/guard.mjs'
import { keys } from '../bundle/keys.mjs'
import { listen, respond } from '../bundle/server.mjs'

const vectors = JSON.parse(readFileSync(new URL('./token-vectors.json', import.meta.url), 'utf8'))
const ring = { current: () => keys(JSON.stringify(vectors.keyFile)) }
const sandboxIdFile = join(mkdtempSync(join(tmpdir(), 'daemon-sandbox-')), '.E2B_SANDBOX_ID')
const now = Math.floor(Date.now() / 1000)
const server = listen(0, { '/version': (_request, response) => respond(response, { build: 'test' }), '/claims': (_request, response, claims) => respond(response, claims) }, guard({ keyring: ring, sandboxIdFile }))

await once(server, 'listening')
after(() => server.close())

const base = `http://127.0.0.1:${server.address().port}`
const mint = vectors.mints[0]

const freshToken = () => {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const { kid, ...jwk } = vectors.signers['test-a']
  const input = `${encode({ alg: 'EdDSA', kid, typ: 'sandbox-daemon+jwt' })}.${encode({ iss: vectors.keyFile.iss, aud: mint.sandboxId, sub: mint.projectId, uid: mint.userId, scope: 'streams:read', iat: now, exp: now + 300 })}`

  return `${input}.${sign(null, Buffer.from(input), createPrivateKey({ key: jwk, format: 'jwk' })).toString('base64url')}`
}

const token = freshToken()
const get = (path, authorization) => fetch(`${base}${path}`, { headers: authorization ? { authorization } : {} })

test('/version needs no token', async () => {
  writeFileSync(sandboxIdFile, mint.sandboxId)

  assert.equal((await get('/version')).status, 200)
})

test('every other path answers 401 without a token, known or not', async () => {
  const [claims, unknown] = await Promise.all([get('/claims'), get('/output')])

  assert.equal(claims.status, 401)
  assert.equal(unknown.status, 401)
  assert.deepEqual(await claims.json(), { error: 'missing' })
})

test('a valid token reaches the route with its claims', async () => {
  writeFileSync(sandboxIdFile, mint.sandboxId)
  const response = await get('/claims', `Bearer ${token}`)

  assert.equal(response.status, 200)
  assert.equal((await response.json()).aud, mint.sandboxId)
})

test('an expired token answers 401', async () => {
  writeFileSync(sandboxIdFile, mint.sandboxId)
  const response = await get('/claims', `Bearer ${mint.token}`)

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { error: 'expired' })
})

test('the sandbox id is read from its file at each verify', async () => {
  writeFileSync(sandboxIdFile, mint.sandboxId)
  assert.equal((await get('/claims', `Bearer ${token}`)).status, 200)

  writeFileSync(sandboxIdFile, 'irestoredsandbox00003\n')
  assert.equal((await get('/claims', `Bearer ${token}`)).status, 401)
})

test('a token outside the Bearer scheme is refused', async () => {
  writeFileSync(sandboxIdFile, mint.sandboxId)

  assert.equal((await get('/claims', `Basic ${token}`)).status, 401)
})
