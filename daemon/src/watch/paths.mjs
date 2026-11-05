export * as Paths from './paths.mjs'

const SKIPPED = ['node_modules', '\\.next', '\\.git', '\\.env[^/]*', '\\.npmrc', '[^/]*\\.pem', '[^/]*\\.key']
const SKIPPED_NAME = new RegExp(`^(?:${SKIPPED.join('|')})$`)

export const IGNORE_PATTERN = `(?:.*/)?(?:${SKIPPED.join('|')})`

export function isSkipped(name) {
  return SKIPPED_NAME.test(name)
}

export function isSkippedPath(path) {
  return path.split('/').some(isSkipped)
}
