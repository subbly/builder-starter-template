const NEVER_WATCHED = new Set(['node_modules', '.next', '.git'])

export function neverWatched(name) {
  return NEVER_WATCHED.has(name)
}

export function neverReported(path) {
  return path.split('/').some(secret)
}

export function skipped(name) {
  return neverWatched(name) || secret(name)
}

const secret = (name) => name.startsWith('.env') || name === '.git' || name === '.npmrc' || name.endsWith('.pem') || name.endsWith('.key')
