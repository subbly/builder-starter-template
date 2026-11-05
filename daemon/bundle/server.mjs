import { createServer } from 'node:http'

export function listen(address, routes) {
  createServer((request, response) => {
    const route = routes[(request.url ?? '/').split('?')[0]]

    if (!route) {
      response.writeHead(404).end()
      return
    }

    route(request, response)
  }).listen(address)
}

export function respond(response, body) {
  response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(body))
}
