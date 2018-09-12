import Debug from 'debug'
import * as semver from 'semver'
import * as stringify from 'json-stringify-safe'

const debug = Debug('axm:transportService')

export class TransportConfig {
  publicKey: string
  secretKey: string
  appName: string
  sendLogs: Boolean
}

export class Actions {
  action_name: string // tslint:disable-line
  action_type: string // tslint:disable-line
  opts?: Object
}

export class Process {
  axm_actions: Actions[] // tslint:disable-line
  axm_monitor: Object // tslint:disable-line
  axm_options: Object // tslint:disable-line
  axm_dynamic?: Object // tslint:disable-line
  interpreter?: string
  versionning?: Object
}

export class Transport {
  send: Function
  disconnect: Function
  on: Function
}

export class Agent {
  transport: Transport
  send: Function
  start: Function
  sendLogs: Boolean
}

export default class TransportService {

  private config: TransportConfig
  private agent: Agent
  private transport: Transport
  private process: Process
  private isStandalone: Boolean = false
  private initiated: Boolean = false // tslint:disable-line

  init () {
    this.initiated = true
    this.isStandalone = false
  }

  async initStandalone (config: TransportConfig) {
    if (!semver.satisfies(process.version, '>= 8.0.0')) {
      this.init()
      return console.error('[STANDALONE MODE] Unable to set standalone mode with node < 8.0.0')
    }
    const AgentNode = require('@pm2/agent-node')
    this.isStandalone = true
    this.initiated = true
    debug('Init new transport service')
    this.config = config
    this.process = {
      axm_actions: [],
      axm_options: {},
      axm_monitor: {}
    }
    this.agent = new AgentNode({
      publicKey: this.config.publicKey,
      secretKey: this.config.secretKey,
      appName: this.config.appName
    }, this.process)
    this.agent.sendLogs = config.sendLogs || false

    try {
      await this.agent.start()
    } catch (err) {
      console.error(err)
      process.exit(1)
    }
    this.transport = this.agent.transport
    return debug('Agent launched')
  }

  setMetrics (metrics) {
    if (this.isStandalone) {
      return this.process.axm_monitor = metrics
    }
    this.send('axm:monitor', metrics)
  }

  addAction (action) {
    debug(`Add action: ${action.action_name}:${action.action_type}`)
    if (this.isStandalone) {
      return this.process.axm_actions.push(action)
    }
    return this.send('axm:action', action)
  }

  setOptions (options) {
    debug(`Set options: [${Object.keys(options).join(',')}]`)
    if (this.isStandalone) {
      return this.process.axm_options = Object.assign(this.process.axm_options, options)
    }
    return this.send('axm:option:configuration', options)
  }

  getFormattedPayload (channel, payload) {
    // Reformat for backend
    switch (channel) {
      case 'axm:reply':
        return { data: payload }
      case 'process:exception':
        return { data: payload }
    }
    return payload
  }

  send (channel, payload) {
    if (this.isStandalone) {
      return this.agent.send(channel, this.getFormattedPayload(channel, payload)) ? 0 : -1
    }
    if (!process.send) return -1
    try {
      process.send(JSON.parse(stringify({
        type: channel,
        data: payload
      })))
    } catch (e) {
      debug('Process disconnected from parent !')
      debug(e.stack || e)
      return process.exit(1)
    }
    return 0
  }

  destroy () {
    if (!this.isStandalone) return
    this.transport.disconnect()
  }
}
