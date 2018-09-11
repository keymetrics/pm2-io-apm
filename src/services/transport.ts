import Debug from 'debug'
import * as stringify from 'json-stringify-safe'

const debug = Debug('axm:transportService')

class TransportConfig {
  publicKey: string
  secretKey: string
  appName: string
}

class Actions {
  action_name: string
  action_type: string
  opts?: Object
}

class Process {
  axm_actions: Actions[]
  axm_monitor: Object
  axm_options: Object
  axm_dynamic?: Object
  interpreter?: string
  versionning?: Object
}

class Transport {
  send: Function
  disconnect: Function
  on: Function
}

class Agent {
  transport: Transport
  send: Function
}

export default class TransportService {

  private config: TransportConfig
  private agent: Agent
  private transport: Transport
  private process: Process
  private isStandalone: Boolean

  init () {
    this.isStandalone = false
  }

  initStandalone (config: TransportConfig, cb: Function) {
    this.isStandalone = true
    const Agent = require('/Users/valentin/Work/Keymetrics/pm2-io-agent-node')
    debug('Init new transport service')
    this.config = config
    this.process = {
      axm_actions: [],
      axm_options: {},
      axm_monitor: {}
    }
    this.agent = new Agent({
      publicKey: config.publicKey,
      secretKey: config.secretKey,
      appName: config.appName
    }, this.process, (err) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      this.transport = this.agent.transport
      debug('Agent launched')
      return cb()
    })
  }

  addAction (action) {
    if (this.isStandalone) return this.process.axm_actions.push(action)
    return this.send('axm:action', action)
  }

  setOptions (options) {
    this.process.axm_options = options
  }

  send (channel, payload) {
    if (this.isStandalone) return this.agent.send(channel, payload)
    if (!process.send) return false
    try {
      process.send(JSON.parse(stringify({
        type: channel,
        data: payload
      })))
    } catch (e) {
      debug('Process disconnected from parent !')
      debug(e.stack || e)
      process.exit(1)
    }
  }

  destroy () {
    this.transport.disconnect()
  }
}