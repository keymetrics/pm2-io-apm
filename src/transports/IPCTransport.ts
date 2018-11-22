import { Transport, TransportConfig } from '../services/transport'
import Debug from 'debug'
import { Action } from '../services/actions'
import { InternalMetric } from '../services/metrics'
import { EventEmitter2 } from 'eventemitter2';

const debug = Debug('axm:transport:ipc')

export class IPCTransport extends EventEmitter2 implements Transport {

  private config: TransportConfig
  private initiated: Boolean = false // tslint:disable-line

  init (config: TransportConfig): Transport {
    debug('Init new transport service')
    if (this.initiated === true) {
      console.error(`Trying to re-init the transport, please avoid`)
      return this
    }
    this.initiated = true
    debug('Agent launched')
    process.on('message', (data: Object) => {
      if (typeof data !== 'object') return
      // we don't actually care about the channel
      this.emit('packet', data)
    })
    return this
  }
  setMetrics (metrics: InternalMetric[]) {
    const serializedMetric = metrics.reduce((object, metric: InternalMetric) => {
      object[metric.name] = {
        historic: metric.historic,
        unit: metric.unit,
        type: metric.id,
        value: metric.value
      }
      return object
    }, {})
    this.send('axm:monitor', metrics)
  }

  addAction (action: Action) {
    debug(`Add action: ${action.name}:${action.type}`)
    return this.send('axm:action', {
      action_name: action.name,
      action_type: action.type,
      arity: action.arity,
      opts: action.opts
    })
  }

  setOptions (options) {
    debug(`Set options: [${Object.keys(options).join(',')}]`)
    return this.send('axm:option:configuration', options)
  }

  send (channel, payload) {
    if (typeof process.send !== 'function') return -1
    try {
      process.send({ type: channel, data: payload })
    } catch (err) {
      debug('Process disconnected from parent !')
      debug(err)
      return process.exit(1)
    }
  }

  destroy () { }
}