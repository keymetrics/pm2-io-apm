import { expect, assert } from 'chai'
import { fork } from 'child_process'
import { resolve } from 'path'

const launch = (fixture) => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: [ '-r', 'ts-node/register' ]
  })
}
describe('HttpWrapper', function () {
  this.timeout(10000)
  it('should wrap http and send basic metric', (done) => {
    const child = launch('../fixtures/metrics/httpWrapperChild')
    let called = false

    child.on('message', pck => {

      if (pck.type === 'axm:monitor') {
        if (called === true) return
        called = true
        expect(pck.data.HTTP.type).to.equal('internal/http/builtin/reqs')
        expect(pck.data.HTTP.unit).to.equal('req/min')

        expect(pck.data['HTTP Mean Latency'].type).to.equal('internal/http/builtin/latency/p50')
        expect(pck.data['HTTP Mean Latency'].unit).to.equal('ms')

        child.kill('SIGINT')
        done()
      }
    })
  })

  it('should use tracing system', (done) => {
    const child = launch('../fixtures/metrics/tracingChild')
    let called = false
    child.on('message', pck => {
      if (pck.type === 'axm:trace' && called === false) {
        called = true
        expect(pck.data.hasOwnProperty('projectId')).to.equal(true)
        expect(pck.data.hasOwnProperty('traceId')).to.equal(true)
        expect(pck.data.spans[0].labels['http/method']).to.equal('GET')
        expect(pck.data.spans[0].labels['http/status_code']).to.equal('200')

        child.kill('SIGINT')
        done()
      }
    })
  })
})
