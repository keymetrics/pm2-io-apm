
import { Action } from './actions'
import { Metric } from './metrics'
import { IPCTransport } from '../transports/IPCTransport'
import { Service } from '../serviceManager'
import { WebsocketTransport } from '../transports/WebsocketTransport'

export class TransportConfig {
  publicKey: string
  secretKey: string
  appName: string
  serverName?: string
  sendLogs: Boolean
}

export interface Transport extends Service {
  /**
   * Init the transporter (connection, listeners etc)
   */
  init: (config: TransportConfig) => Transport
  /**
   * Destroy the instance (disconnect, cleaning listeners etc)
   */
  destroy: () => void
  /**
   * Listen for event incoming from a reverse connection
   */
  on: (name: string, handler: Function) => void
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
  setMetrics: (metrics: Metric[]) => void
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
