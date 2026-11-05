export * as Paths from './paths.mjs'

const NEVER_WATCHED = new Set(['node_modules', '.next', '.git'])

export function isNeverWatched(name) {
  return NEVER_WATCHED.has(name)
}

export function isNeverReported(path) {
  return path.split('/').some(isSecret)
}

export function isSkipped(name) {
  return isNeverWatched(name) || isSecret(name)
}

const isSecret = (name) => name.startsWith('.env') || name === '.git' || name === '.npmrc' || name.endsWith('.pem') || name.endsWith('.key')
