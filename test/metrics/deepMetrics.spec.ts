import { expect, assert } from 'chai'
import 'mocha'

import SpecUtils from '../fixtures/utils'
import { fork, exec } from 'child_process'

describe('DeepMetrics', function () {
  this.timeout(10000)
  it('should send info about all metrics', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/metrics/deepMetricsChild.js'))

    child.on('message', pck => {

      if (pck.type === 'axm:monitor') {
        expect(pck.data['HTTP out: Response time'].agg_type).to.equal('avg')
        expect(pck.data['HTTP out: Response time'].historic).to.equal(true)
        expect(pck.data['HTTP out: Response time'].type).to.equal('internal/http/outbound/latency')
        expect(pck.data['HTTP out: Response time'].unit).to.equal('ms')

        expect(pck.data['HTTP out: Throughput'].agg_type).to.equal('avg')
        expect(pck.data['HTTP out: Throughput'].historic).to.equal(true)
        expect(pck.data['HTTP out: Throughput'].type).to.equal('internal/http/outbound/throughput')
        expect(pck.data['HTTP out: Throughput'].unit).to.equal('req/min')

        child.kill('SIGINT')
        done()
      }
    })
  })
})
