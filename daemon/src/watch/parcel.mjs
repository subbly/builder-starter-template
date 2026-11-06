import { createRequire } from 'node:module'

export const parcel = createRequire(import.meta.url)('../../vendor/parcel-watcher.node')
