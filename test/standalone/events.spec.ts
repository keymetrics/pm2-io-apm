process.env.PM2_SECRET_KEY = 'bb'
process.env.PM2_PUBLIC_KEY = 'aa'
process.env.PM2_APP_NAME = 'service'
process.env.KEYMETRICS_NODE = 'http://localhost:5934'

import * as assert from 'assert'
import 'mocha'
import * as io from '../../src'
// install patch before requiring the helpers
io.init()
import { WSServer, HandshakeServer } from './helper'

describe('Standalone Tracing', function () {
  this.timeout(10000)
  let httpServer
  let wsServer
  let apm

  before(() => {
    httpServer = new HandshakeServer()
    wsServer = new WSServer()
  })

  after(() => {
    io.destroy()
    httpServer.destroy()
    wsServer.destroy()
  })

  it('should init agent', () => {
    io.init() // the standalone mode should be enabled automaticaly
  })

  it('should receive status', (done) => {
    wsServer.once('message', (data) => {
      const packet = JSON.parse(data)
      assert(packet.channel === 'status'
        || packet.channel === 'application:dependencies')
      return done()
    })
  })

  it('should send event and receive data', (done) => {
    wsServer.on('message', (data) => {
      const packet = JSON.parse(data)
      if (packet.channel !== 'human:event') return
      assert(typeof packet.payload.name === 'string')
      assert(typeof packet.payload.data.custom === 'number')
      assert(typeof packet.payload.data.nested === 'object')
      wsServer.removeAllListeners()
      return done()
    })
    io.emit('test', {
      custom: 1,
      number: 2,
      nested: {
        afrg: 2
      }
    })
  })
})
