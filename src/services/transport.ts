
import { Action } from './actions'
import { Metric, InternalMetric } from './metrics'
import { IPCTransport } from '../transports/IPCTransport'
import { WebsocketTransport } from '../transports/WebsocketTransport'
import { EventEmitter2 } from 'eventemitter2'

export class TransportConfig {
  /**
   * public key of the bucket to which the agent need to connect
   */
  publicKey: string
  /**
   * Secret key of the bucket to which the agent need to connect
   */
  secretKey: string
  /**
   * The name of the application/service that will be reported to PM2 Enterprise
   */
  appName: string
  /**
   * The name of the server as reported in PM2 Enterprise
   *
   * default is os.hostname()
   */
  serverName?: string
  /**
   * Broadcast all the logs from your application to our backend
   */
  sendLogs?: Boolean
  /**
   * Since logs can be forwared to our backend you may want to ignore specific
   * logs (containing sensitive data for example)
   */
  logFilter?: string | RegExp
  /**
   * Proxy URI to use when reaching internet
   * Supporting socks5,http,https,pac,socks4
   * see https://github.com/TooTallNate/node-proxy-agent
   *
   * example: socks5://username:password@some-socks-proxy.com:9050
   */
  proxy?: string
}

export interface Transport extends EventEmitter2 {
  /**
   * Init the transporter (connection, listeners etc)
   */
  init: (config: TransportConfig) => Transport
  /**
   * Destroy the instance (disconnect, cleaning listeners etc)
   */
  destroy: () => void
  /**
   * Send data to remote endpoint
   */
  send: (channel: string, payload: Object) => void
  /**
   * Declare available actions
   */
  addAction: (action: Action) => void
  /**
   * Declare metrics
   */
  setMetrics: (metrics: InternalMetric[]) => void
  /**
   * Declare options for process
   */
  setOptions: (options: any) => void
}

/**
 * Init a transporter implementation with a specific config
 */
export function createTransport (name: string, config: TransportConfig): Transport {
  switch (name) {
    case 'ipc': {
      const transport = new IPCTransport()
      transport.init(config)
      return transport
    }
    case 'websocket': {
      const transport = new WebsocketTransport()
      transport.init(config)
      return transport
    }
  }
  console.error(`Failed to find transport implementation: ${name}`)
  return process.exit(1)
}
