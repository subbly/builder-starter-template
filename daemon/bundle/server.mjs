import { createServer } from 'node:http'

export function listen(address, routes, guard) {
  return createServer((request, response) => {
    const path = (request.url ?? '/').split('?')[0]
    const verdict = guard ? guard(request, path) : { claims: null }

    if (verdict.reason) {
      response.writeHead(401, { 'content-type': 'application/json', 'cache-control': 'no-store', 'www-authenticate': 'Bearer' }).end(JSON.stringify({ error: verdict.reason }))
      return
    }

    const route = routes[path]

    if (!route) {
      response.writeHead(404).end()
      return
    }

    route(request, response, verdict.claims)
  }).listen(address)
}

export function respond(response, body) {
  response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(body))
}
