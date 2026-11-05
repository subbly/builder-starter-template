import { respond } from './server.mjs'

export function version(manifest) {
  return (_request, response) => respond(response, manifest)
}
