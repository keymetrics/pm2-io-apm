import { expect, assert } from 'chai'
import 'mocha'

import SpecUtils from '../fixtures/utils'
import { fork, exec } from 'child_process'

describe('HttpWrapper', function () {
  this.timeout(10000)
  it('should wrap http and send basic metric', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/features/httpWrapperChild.js'))

    child.on('message', pck => {

      if (pck.type === 'http:transaction') {
        expect(pck.data.url).to.equal('/')
      }

      if (pck.type === 'axm:monitor' && pck.data.HTTP.value !== '0req/min') {
        expect(pck.data.HTTP.type).to.equal('HTTP')
        expect(pck.data.HTTP.agg_type).to.equal('avg')
        expect(pck.data.HTTP.unit).to.equal('req/min')

        expect(pck.data['pmx:http:latency'].type).to.equal('pmx:http:latency')
        expect(pck.data['pmx:http:latency'].agg_type).to.equal('avg')
        expect(pck.data['pmx:http:latency'].unit).to.equal('ms')

        child.kill('SIGINT')
        done()
      }
    })
  })
})
