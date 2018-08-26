import { expect, assert } from 'chai'
import 'mocha'

import SpecUtils from '../fixtures/utils'
import { fork, exec } from 'child_process'

describe('EventLoopDelay', function () {
  this.timeout(7000)
  it('should send event loop delay', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/metrics/eventLoopDelayChild.js'))
    let count = 0

    child.on('message', pck => {
      if (pck.type === 'axm:monitor' && pck.data['Event Loop Latency'].value !== '0ms') {
        expect(pck.data['Event Loop Latency'].agg_type).to.equal('avg')
        expect(pck.data['Event Loop Latency'].historic).to.equal(true)
        expect(pck.data['Event Loop Latency'].type).to.equal('internal/libuv/latency')
        expect(pck.data['Event Loop Latency'].unit).to.equal('ms')

        child.kill('SIGINT')
        count++
      }
    })

    child.on('exit', function () {
      expect(count > 0).to.equal(true)
      done()
    })
  })
})
