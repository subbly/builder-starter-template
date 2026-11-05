import { respond } from '../server/server.mjs'

export function version(manifest) {
  return (_request, response) => respond(response, manifest)
}
