import { Transport, TransportConfig } from '../services/transport'
import * as Debug from 'debug'
import { Action } from '../services/actions'
import { InternalMetric } from '../services/metrics'
import { EventEmitter2 } from 'eventemitter2'

export class IPCTransport extends EventEmitter2 implements Transport {

  private initiated: Boolean = false // tslint:disable-line
  private logger: Function = Debug('axm:transport:ipc')

  init (config?: TransportConfig): Transport {
    this.logger('Init new transport service')
    if (this.initiated === true) {
      console.error(`Trying to re-init the transport, please avoid`)
      return this
    }
    this.initiated = true
    this.logger('Agent launched')
    process.on('message', (data?: Object) => {
      if (typeof data !== 'object') return
      // we don't actually care about the channel
      this.emit('packet', data)
    })
    return this
  }
  setMetrics (metrics: InternalMetric[]) {
    const serializedMetric = metrics.reduce((object, metric: InternalMetric) => {
      if (typeof metric.name !== 'string') return object
      object[metric.name] = {
        historic: metric.historic,
        unit: metric.unit,
        type: metric.id,
        value: metric.value
      }
      return object
    }, {})
    this.send('axm:monitor', serializedMetric)
  }

  addAction (action: Action) {
    this.logger(`Add action: ${action.name}:${action.type}`)
    return this.send('axm:action', {
      action_name: action.name,
      action_type: action.type,
      arity: action.arity,
      opts: action.opts
    })
  }

  setOptions (options) {
    this.logger(`Set options: [${Object.keys(options).join(',')}]`)
    return this.send('axm:option:configuration', options)
  }

  send (channel, payload) {
    if (typeof process.send !== 'function') return -1
    try {
      process.send({ type: channel, data: payload })
    } catch (err) {
      this.logger('Process disconnected from parent !')
      this.logger(err)
      return process.exit(1)
    }
  }

  destroy () {
    this.logger('destroy')
  }
}
