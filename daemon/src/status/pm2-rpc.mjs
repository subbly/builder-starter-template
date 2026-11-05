import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

export function pm2Rpc({ bin, socket, timeout }) {
  let modules = null
  let loadFailed = false
  let link = null
  let inflight = null
  let epoch = 0

  const load = () => {
    if (!modules) {
      try {
        const require = createRequire(join(dirname(realpathSync(bin)), '..', 'package.json'))

        modules = { axon: require('./modules/pm2-axon'), rpc: require('./modules/pm2-axon-rpc') }
      } catch (error) {
        if (!loadFailed) {
          console.error(`pm2's axon modules did not load from ${bin}: ${error.message}`)
          loadFailed = true
        }
      }
    }

    return modules
  }

  const connect = () =>
    new Promise((resolve) => {
      const req = modules.axon.socket('req')
      const opened = { req, client: new modules.rpc.Client(req), pending: null }

      req.set('retry timeout', 0)
      req.once('connect', () => resolve(opened))
      req.once('close', () => {
        if (link === opened) {
          link = null
        }

        opened.pending?.(null)
        resolve(null)
      })
      req.on('error', () => req.close())
      req.connect(socket)
    })

  const call = (opened) =>
    new Promise((resolve) => {
      const timer = setTimeout(() => opened.req.close(), timeout)

      opened.pending = (processes) => {
        clearTimeout(timer)
        opened.pending = null
        resolve(processes)
      }
      opened.client.call('getMonitorData', {}, (error, list) => {
        opened.pending?.(error || !Array.isArray(list) ? null : list.map((process) => ({ name: process.name, pid: process.pid, status: process.pm2_env?.status })))
      })
    })

  const read = async () => {
    if (!load()) {
      return null
    }

    if (!link) {
      const at = epoch
      const opened = await connect()

      if (at !== epoch) {
        opened?.req.close()
        return null
      }

      link = opened
    }

    return link ? call(link) : null
  }

  return {
    processes() {
      if (!inflight) {
        const current = read().finally(() => {
          if (inflight === current) {
            inflight = null
          }
        })

        inflight = current
      }

      return inflight
    },
    close() {
      epoch += 1
      inflight = null
      link?.req.close()
      link = null
    },
  }
}
