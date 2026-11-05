import assert from 'node:assert/strict'
import { relative } from 'node:path'
import { test } from 'node:test'
import { WATCH_ROOT } from '../bundle/contract.mjs'
import { neverReported, neverWatched, skipped } from '../bundle/paths.mjs'

test('secret files are never reported, at any depth', () => {
  for (const path of ['.env', '.env.local', 'apps/web/.env.production', '.envrc', 'cert.pem', 'ssl/server.key', '.npmrc', 'packages/a/.npmrc', '.git', '.git/config', 'nested/repo/.git', 'secrets.pem/readme.md', '.env.d/values']) {
    assert.equal(neverReported(path), true, path)
  }
})

test('ordinary files are reported', () => {
  for (const path of ['src/env.ts', 'src/keys.ts', 'monkey', 'cert.pem.txt', 'a.keystore', '.gitignore', '.github/workflows/ci.yml', 'environment.md', 'src/app/page.tsx', '.subbly/notes.md']) {
    assert.equal(neverReported(path), false, path)
  }
})

test('dependency, build and git trees are never watched, at any depth', () => {
  for (const name of ['node_modules', '.next', '.git']) {
    assert.equal(neverWatched(name), true, name)
    assert.equal(skipped(name), true, name)
  }

  for (const name of ['src', 'next', 'modules', '.github', '.gitignore']) {
    assert.equal(neverWatched(name), false, name)
  }

  assert.equal(skipped('.env.local'), true)
  assert.equal(skipped('src'), false)
})

test('chat worktrees live outside the watch root', () => {
  assert.equal(WATCH_ROOT, '/project/workspace/main')
  assert.match(relative(WATCH_ROOT, '/project/workspace/.subbly/worktrees/chat-1/src/page.tsx'), /^\.\.\//)
})
