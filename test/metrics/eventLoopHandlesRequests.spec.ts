import { expect, assert } from 'chai'
import 'mocha'

import SpecUtils from '../fixtures/utils'
import { fork, exec } from 'child_process'
import EventLoopHandlesRequestsMetric from './eventLoopMetrics'

describe('EventLoopHandlesRequests', function () {

  it('should send event loop handles and requests counter', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/metrics/eventLoopHandlesRequestsChild.js'))

    child.on('message', pck => {

      if (pck.type === 'axm:monitor') {
        expect(pck.data['Active handles'].agg_type).to.equal('avg')
        expect(pck.data['Active handles'].historic).to.equal(true)
        expect(pck.data['Active handles'].type).to.equal('internal/libuv/handles')

        child.kill('SIGINT')
        done()
      }
    })
  })
})
