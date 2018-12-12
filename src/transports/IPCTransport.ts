import { Transport, TransportConfig } from '../services/transport'
import * as Debug from 'debug'
import { Action } from '../services/actions'
import { InternalMetric } from '../services/metrics'
import { EventEmitter2 } from 'eventemitter2'
import * as cluster from 'cluster'
import * as EventLoopInspector from 'event-loop-inspector'

export class IPCTransport extends EventEmitter2 implements Transport {

  private initiated: Boolean = false // tslint:disable-line
  private logger: Function = Debug('axm:transport:ipc')
  private onMessage: any | undefined
  private eventLoopInspector = EventLoopInspector(false)
  private autoExitHandle: NodeJS.Timer | undefined

  init (config?: TransportConfig): Transport {
    this.logger('Init new transport service')
    if (this.initiated === true) {
      console.error(`Trying to re-init the transport, please avoid`)
      return this
    }
    this.initiated = true
    this.logger('Agent launched')
    this.onMessage = (data?: Object) => {
      this.logger(`Received reverse message from IPC`)
      this.emit('data', data)
    }
    process.on('message', this.onMessage)

    // if the process is standalone, the fact that there is a listener attached
    // forbid the event loop to exit when there are no other task there
    if (cluster.isWorker === false) {
      this.autoExitHook()
    }
    return this
  }

  private autoExitHook () {
    // clean listener if event loop is empty
    // important to ensure apm will not prevent application to stop
    this.autoExitHandle = setInterval(() => {
      const dump = this.eventLoopInspector.dump()
      const requests = Object.keys(dump.requests)
      const handles = Object.keys(dump.handles)
      const sockets = dump.handles.Socket
      const pipes = dump.handles.Pipe
      const hasStdOut = sockets && sockets.find(sock => sock.fd === 1) !== undefined
      const hasStdErr = sockets && sockets.find(sock => sock.fd === 2) !== undefined
      // standard out/err count has uv_handle
      const isSocketStds = sockets && sockets.length === 2 && hasStdErr && hasStdOut
      const isOnlySocketStds = handles.length === 1 && isSocketStds
      // IPC count as a uv_pipe under < node 8
      const isStdsWithIPC = isSocketStds && pipes && pipes.length === 1 && handles.length === 2
      // if there are only std outputs or with IPC, we should still exist
      const shouldStillExit = isStdsWithIPC || isOnlySocketStds

      // if there are handles or requests and there aren't default standard output/err
      if ((handles.length > 0 || requests.length > 0) && shouldStillExit === false) {
        return this.logger('no need to exit, there are handles/requests in uv', JSON.stringify(dump))
      }
      this.logger(`Nothing found in uv, removing the IPC listener`)
      process.removeListener('message', this.onMessage)
      let tmp = setTimeout(_ => {
        this.logger(`Still alive, listen back to IPC`)
        process.on('message', this.onMessage)
      }, 200)
      tmp.unref()
    }, 5000)
    this.autoExitHandle.unref()
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
    this.send('axm:action', {
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
    if (this.onMessage !== undefined) {
      process.removeListener('message', this.onMessage)
    }
    if (this.autoExitHandle !== undefined) {
      clearInterval(this.autoExitHandle)
    }
    this.logger('destroy')
  }
}
