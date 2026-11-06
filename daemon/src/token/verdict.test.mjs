import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { keys } from './keys.mjs'
import { verdict } from './verdict.mjs'

const vectors = JSON.parse(readFileSync(new URL('./token-vectors.json', import.meta.url), 'utf8'))
const keyFiles = { keyFile: keys(JSON.stringify(vectors.keyFile)), otherKeyFile: keys(JSON.stringify(vectors.otherKeyFile)) }

for (const vector of vectors.verifies) {
  test(vector.name, () => {
    const tokenVerdict = verdict(vector.token, { keys: keyFiles[vector.keyFile], sandboxId: vector.sandboxId, now: vector.now })

    assert.equal(tokenVerdict.reason ?? null, vector.reason)
  })
}

for (const mint of vectors.mints) {
  test(`${mint.name}, and the daemon accepts the token`, () => {
    const tokenVerdict = verdict(mint.token, { keys: keyFiles.keyFile, sandboxId: mint.sandboxId, now: mint.now })

    assert.deepEqual(tokenVerdict.claims, {
      iss: vectors.keyFile.iss,
      aud: mint.sandboxId,
      sub: mint.projectId,
      uid: mint.userId,
      scope: 'streams:read',
      iat: mint.now,
      exp: mint.now + 300,
    })
  })
}
