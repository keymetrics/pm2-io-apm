import { expect, assert } from 'chai'
import 'mocha'

import SpecUtils from '../fixtures/utils'
import { fork, exec } from 'child_process'

describe('HttpWrapper', function () {
  this.timeout(10000)
  it('should wrap http and send basic metric', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/metrics/httpWrapperChild.js'))

    child.on('message', pck => {

      if (pck.type === 'http:transaction') {
        expect(pck.data.url).to.equal('/')
      }

      if (pck.type === 'axm:monitor' && pck.data.HTTP.value !== '0req/min') {
        expect(pck.data.HTTP.type).to.equal('internal/http/builtin/reqs')
        expect(pck.data.HTTP.agg_type).to.equal('avg')
        expect(pck.data.HTTP.unit).to.equal('req/min')

        expect(pck.data['pmx:http:latency'].type).to.equal('internal/http/builtin/latency')
        expect(pck.data['pmx:http:latency'].agg_type).to.equal('avg')
        expect(pck.data['pmx:http:latency'].unit).to.equal('ms')

        child.kill('SIGINT')
        done()
      }
    })
  })

  it('should use tracing system', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/metrics/tracingChild.js'))
    let isAlive = true
    child.on('message', pck => {

      if (pck.type === 'axm:trace') {
        expect(pck.data.hasOwnProperty('projectId')).to.equal(true)
        expect(pck.data.hasOwnProperty('traceId')).to.equal(true)
        expect(pck.data.spans[0].name).to.equal('/')
        expect(pck.data.spans[0].labels['http/method']).to.equal('GET')
        expect(pck.data.spans[0].labels['http/path']).to.equal('/')
        expect(pck.data.spans[0].labels['http/url']).to.equal('http://localhost/')
        expect(pck.data.spans[0].labels['express/request.route.path']).to.equal('/')
        expect(pck.data.spans[0].labels['http/status_code']).to.equal('200')

        if (isAlive) {
          child.kill('SIGINT')
          done()
          isAlive = false
        }
      }
    })
  })
})
