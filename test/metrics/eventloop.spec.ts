import { expect, assert } from 'chai'
import { fork } from 'child_process'
import { resolve } from 'path'

const launch = (fixture) => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: process.env.NYC_ROOT_ID ? process.execArgv : [ '-r', 'ts-node/register' ]
  })
}

describe('EventLoopHandlesRequests', function () {
  this.timeout(5000)

  it('should send event loop handles and requests counter', (done) => {
    const child = launch('../fixtures/metrics/eventLoopHandlesRequestsChild')

    child.on('message', pck => {

      if (pck.type === 'axm:monitor') {
        expect(pck.data['Active handles'].historic).to.equal(true)
        expect(pck.data['Active handles'].type).to.equal('internal/libuv/handles')

        child.kill('SIGINT')
        done()
      }
    })
  })
  it('should send event loop delay', (done) => {
    const child = launch('../fixtures/metrics/eventLoopDelayChild')

    child.on('message', pck => {
      if (pck.type === 'axm:monitor' && pck.data['Event Loop Latency']) {
        expect(pck.data['Event Loop Latency'].historic).to.equal(true)
        expect(pck.data['Event Loop Latency'].type).to.equal('internal/libuv/latency/p50')
        expect(pck.data['Event Loop Latency'].unit).to.equal('ms')

        child.kill('SIGINT')
        done()
      }
    })
  })
})
