import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

export function pm2Rpc({ bin, socket, timeout }) {
  let modules = null
  let hasLoadFailed = false
  let link = null
  let inflight = null
  let epoch = 0

  const load = () => {
    if (modules) {
      return modules
    }

    try {
      const require = createRequire(join(dirname(realpathSync(bin)), '..', 'package.json'))

      modules = { axon: require('./modules/pm2-axon'), rpc: require('./modules/pm2-axon-rpc') }
    } catch (error) {
      if (!hasLoadFailed) {
        console.error(`pm2's axon modules did not load from ${bin}: ${error.message}`)
      }

      hasLoadFailed = true
    }

    return modules
  }

  const connect = () => {
    return new Promise((resolve) => {
      const requester = modules.axon.socket('req')
      const opened = { requester, client: new modules.rpc.Client(requester), pending: null }

      requester.set('retry timeout', 0)
      requester.once('connect', () => resolve(opened))
      requester.once('close', () => {
        if (link === opened) {
          link = null
        }

        opened.pending?.(null)
        resolve(null)
      })
      requester.on('error', () => requester.close())
      requester.connect(socket)
    })
  }

  const call = (opened) => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => opened.requester.close(), timeout)

      opened.pending = (processes) => {
        clearTimeout(timer)
        opened.pending = null
        resolve(processes)
      }
      opened.client.call('getMonitorData', {}, (error, list) => {
        opened.pending?.(error || !Array.isArray(list) ? null : list.map((process) => ({ name: process.name, pid: process.pid, status: process.pm2_env?.status })))
      })
    })
  }

  const read = async () => {
    if (!load()) {
      return null
    }

    if (link) {
      return call(link)
    }

    const at = epoch
    const opened = await connect()

    if (at !== epoch) {
      opened?.requester.close()
      return null
    }

    link = opened

    return link ? call(link) : null
  }

  return {
    processes() {
      if (inflight) {
        return inflight
      }

      const current = read().finally(() => {
        if (inflight === current) {
          inflight = null
        }
      })

      inflight = current

      return inflight
    },
    close() {
      epoch += 1
      inflight = null
      link?.requester.close()
      link = null
    },
  }
}
