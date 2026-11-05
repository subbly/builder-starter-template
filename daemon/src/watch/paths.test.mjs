import assert from 'node:assert/strict'
import { relative } from 'node:path'
import { test } from 'node:test'
import { Contract } from '../contract.mjs'
import { Paths } from './paths.mjs'

test('secret files are never reported, at any depth', () => {
  for (const path of ['.env', '.env.local', 'apps/web/.env.production', '.envrc', 'cert.pem', 'ssl/server.key', '.npmrc', 'packages/a/.npmrc', '.git', '.git/config', 'nested/repo/.git', 'secrets.pem/readme.md', '.env.d/values']) {
    assert.equal(Paths.isNeverReported(path), true, path)
  }
})

test('ordinary files are reported', () => {
  for (const path of ['src/env.ts', 'src/keys.ts', 'monkey', 'cert.pem.txt', 'a.keystore', '.gitignore', '.github/workflows/ci.yml', 'environment.md', 'src/app/page.tsx', '.subbly/notes.md']) {
    assert.equal(Paths.isNeverReported(path), false, path)
  }
})

test('dependency, build and git trees are never watched, at any depth', () => {
  for (const name of ['node_modules', '.next', '.git']) {
    assert.equal(Paths.isNeverWatched(name), true, name)
    assert.equal(Paths.isSkipped(name), true, name)
  }

  for (const name of ['src', 'next', 'modules', '.github', '.gitignore']) {
    assert.equal(Paths.isNeverWatched(name), false, name)
  }

  assert.equal(Paths.isSkipped('.env.local'), true)
  assert.equal(Paths.isSkipped('src'), false)
})

test('chat worktrees live outside the watch root', () => {
  assert.equal(Contract.WATCH_ROOT, '/project/workspace/main')
  assert.match(relative(Contract.WATCH_ROOT, '/project/workspace/.subbly/worktrees/chat-1/src/page.tsx'), /^\.\.\//)
})
