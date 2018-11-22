import { Transport, TransportConfig } from '../services/transport'
import * as semver from 'semver'
import Debug from 'debug'
import { Action } from '../services/actions'
import { InternalMetric } from '../services/metrics'

const debug = Debug('axm:transport:websocket')

class SerializedAction {
  action_name: string // tslint:disable-line
  action_type: string // tslint:disable-line
  opts: Object | null | undefined
  arity: number
}

export class ProcessMetadata {
  axm_actions: SerializedAction[] // tslint:disable-line
  axm_monitor: Object // tslint:disable-line
  axm_options: Object // tslint:disable-line
  axm_dynamic?: Object // tslint:disable-line
  interpreter?: string
  versionning?: Object
}

export class WebsocketTransport implements Transport {

  private config: TransportConfig
  private agent: any
  private process: ProcessMetadata
  private initiated: Boolean = false // tslint:disable-line

  init (config: TransportConfig): Transport {
    if (!semver.satisfies(process.version, '>= 6.0.0')) {
      console.error('[STANDALONE MODE] Unable to set standalone mode with node < 6.0.0')
      return process.exit(1)
    }
    if (this.initiated === true) {
      console.error(`Trying to re-init the transport, please avoid`)
      return this
    }
    this.initiated = true
    const AgentNode = require('@pm2/agent-node')
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
      appName: this.config.appName,
      serverName: this.config.serverName
    }, this.process)
    this.agent.sendLogs = config.sendLogs || false

    this.agent.start()
    debug('Agent launched')
    return this
  }

  setMetrics (metrics: InternalMetric[]) {
    return this.process.axm_monitor = metrics.reduce((object, metric: InternalMetric) => {
      object[metric.name] = {
        historic: metric.historic,
        unit: metric.unit,
        type: metric.id,
        value: metric.value
      }
      return object
    }, {})
  }

  addAction (action: Action) {
    debug(`Add action: ${action.name}:${action.type}`)
    const serializedAction: SerializedAction = {
      action_name: action.name,
      action_type: action.type,
      arity: action.arity,
      opts: action.opts
    }
    this.process.axm_actions.push(serializedAction)
  }

  setOptions (options) {
    debug(`Set options: [${Object.keys(options).join(',')}]`)
    return this.process.axm_options = Object.assign(this.process.axm_options, options)
  }

  private getFormattedPayload (channel, payload) {
    // Reformat for backend
    switch (channel) {
      case 'axm:reply':
        return { data: payload }
      case 'process:exception':
        return { data: payload }
    }
    return payload
  }

  send (channel: string, payload: Object) {
    return this.agent.send(channel, this.getFormattedPayload(channel, payload)) ? 0 : -1
  }

  destroy () {
    this.agent.transport.disconnect()
  }

  on () {
    return this.agent.transport.on.apply(this, arguments)
  }
}