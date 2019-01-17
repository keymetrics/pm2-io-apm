import { expect, assert } from 'chai'
import { fork } from 'child_process'
import { resolve } from 'path'

const launch = (fixture) => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: process.env.NYC_ROOT_ID ? process.execArgv : [ '-r', 'ts-node/register' ]
  })
}
describe('Tracing with IPC transport', function () {
  this.timeout(10000)

  it('should use tracing system', (done) => {
    const child = launch('../fixtures/metrics/tracingChild')
    let called = false
    child.on('message', pck => {
      if (pck.type === 'trace-span' && called === false) {
        called = true
        expect(pck.data.hasOwnProperty('id')).to.equal(true)
        expect(pck.data.hasOwnProperty('traceId')).to.equal(true)
        expect(pck.data.tags['http.method']).to.equal('GET')
        expect(pck.data.tags['http.status_code']).to.equal('200')

        child.kill('SIGINT')
        done()
      }
    })
  })
})
