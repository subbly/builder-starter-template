import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Paths } from './paths.mjs'

test('secret files are never reported, at any depth', () => {
  for (const path of ['.env', '.env.local', 'apps/web/.env.production', '.envrc', 'cert.pem', 'ssl/server.key', '.npmrc', 'packages/a/.npmrc', '.git', '.git/config', 'nested/repo/.git', 'secrets.pem/readme.md', '.env.d/values']) {
    assert.equal(Paths.isSkippedPath(path), true, path)
  }
})

test('ordinary files are reported', () => {
  for (const path of ['src/env.ts', 'src/keys.ts', 'monkey', 'cert.pem.txt', 'a.keystore', '.gitignore', '.github/workflows/ci.yml', 'environment.md', 'src/app/page.tsx', '.subbly/notes.md']) {
    assert.equal(Paths.isSkippedPath(path), false, path)
  }
})

test('dependency, build and git trees are never watched, at any depth', () => {
  for (const path of ['node_modules', '.next', '.git', 'packages/a/node_modules/react', 'apps/web/.next/cache']) {
    assert.equal(Paths.isSkippedPath(path), true, path)
  }

  for (const name of ['src', 'next', 'modules', '.github', '.gitignore']) {
    assert.equal(Paths.isSkipped(name), false, name)
  }
})

test('the subscription ignores the same names the reader skips', () => {
  const ignored = new RegExp(`^${Paths.IGNORE_PATTERN}$`)

  for (const path of ['/project/workspace/main/node_modules', '/project/workspace/main/apps/web/.next', '/project/workspace/main/.git', '/project/workspace/main/.env.local', '/project/workspace/main/.npmrc', '/project/workspace/main/ssl/cert.pem', '/project/workspace/main/server.key']) {
    assert.equal(ignored.test(path), true, path)
  }

  for (const path of ['/project/workspace/main/src', '/project/workspace/main/.gitignore', '/project/workspace/main/cert.pem.txt', '/project/workspace/main/environment.md']) {
    assert.equal(ignored.test(path), false, path)
  }
})
