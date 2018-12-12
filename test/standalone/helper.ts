
import * as WebSocket from 'ws'
import { EventEmitter2 } from 'eventemitter2'
import { createServer, Server } from 'http'
import * as express from 'express'

export class WSServer extends EventEmitter2 {
  private wss

  constructor (port = 3405) {
    super()
    // @ts-ignore
    this.wss = new WebSocket.Server({ port })
    this.wss.on('connection', (ws) => {
      this.emit('connection', ws)
      ws.on('message', data => {
        this.emit('message', data)
      })
    })
  }

  destroy () {
    this.wss.close()
  }
}

export class HandshakeServer {
  private server: any
  constructor (wsEndpoint: number = 3405, httpEndpoint: number = 5934) {
    const app = express()
    app.use((req, res) => {
      return res.status(200).json({
        disabled: false,
        active: true,
        endpoints: {
          'ws': `ws://localhost:${wsEndpoint}`
        }
      })
    })
    this.server = app.listen(httpEndpoint)
  }

  destroy () {
    this.server.close()
  }
}
