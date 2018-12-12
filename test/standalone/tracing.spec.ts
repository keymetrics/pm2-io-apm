
import * as assert from 'assert'
import 'mocha'
import * as semver from 'semver'
import * as io from '../../src/'
// install patch before requiring the helpers
io.init({
  tracing: true
})
import * as http from 'http'
import { WSServer, HandshakeServer } from './helper'

if (semver.satisfies(process.version, '< 6')) {
  console.log('standalone test need to be ran under at least node 6')
  process.exit(0)
}

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
    process.env.KEYMETRICS_NODE = 'http://localhost:5934'
    io.init({
      standalone: true,
      apmOptions: {
        publicKey: 'aa',
        secretKey: 'bb',
        appName: 'service'
      },
      tracing: true
    })
  })

  it('should receive status', (done) => {
    wsServer.once('message', (data) => {
      const packet = JSON.parse(data)
      assert(packet.channel === 'status')
      return done()
    })
  })

  it('should trace request and not receive data', (done) => {
    wsServer.on('message', (data) => {
      const packet = JSON.parse(data)
      assert(packet.channel === 'status')
    })
    http.get('http://localhost:5934', () => {
      return
    })
    http.get('http://localhost:5934', () => {
      return
    })
    http.get('http://localhost:5934', () => {
      return
    })
    setTimeout(_ => {
      wsServer.removeAllListeners()
      return done()
    }, 1000)
  })

  it('should have aggregated some spans', () => {
    // @ts-ignore
    const agg = io.transport.traceAggregator.getAggregation()
    const routes = agg.routes
    assert(Object.keys(agg).length === 2, 'should have traced index and verifyMetadata')
  })

  it('get packet that will be sended to remote', () => {
    // @ts-ignore
    const packet = io.transport.traceAggregator.prepareAggregationforShipping()
    assert(typeof packet.meta === 'object', 'should have metadata')
    assert(packet.meta.trace_count > 0, 'should aggregate multiple traces')
    assert(packet.routes instanceof Array, 'routes should be an array')
    const route = packet.routes[0]
    assert(typeof route.path === 'string', 'should have a path')
    assert(route.variances instanceof Array, 'should have variances')
    assert(route.variances.length > 0, 'should have one variance at least')
    assert(typeof route.meta === 'object', 'route should have metadata')
  })
})
