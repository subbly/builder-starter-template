import { createServer } from 'node:http'

export function listen(address, { routes, guard, origins }) {
  return createServer({ requestTimeout: 0 }, (request, response) => {
    const path = (request.url ?? '/').split('?')[0]

    allowOrigin(request, response, origins)

    if (request.method === 'OPTIONS') {
      response.writeHead(204).end()
      return
    }

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

const allowOrigin = (request, response, origins) => {
  const origin = request.headers.origin

  response.setHeader('vary', 'Origin')

  if (!origins.includes(origin)) {
    return
  }

  response.setHeader('access-control-allow-origin', origin)
  response.setHeader('access-control-allow-methods', 'GET')
  response.setHeader('access-control-allow-headers', 'Authorization, Last-Event-ID')
  response.setHeader('access-control-max-age', '7200')
  response.setHeader('timing-allow-origin', origin)
}
