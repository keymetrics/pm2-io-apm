import { expect, assert } from 'chai'
import { fork } from 'child_process'
import { resolve } from 'path'

const launch = (fixture) => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: process.env.NYC_ROOT_ID ? process.execArgv : [ '-r', 'ts-node/register' ],
    env: { NODE_ENV: 'test' }
  })
}

describe.skip('Tracing with IPC transport', function () {
  this.timeout(10000)

  it('should use tracing system', (done) => {
    const child = launch('../fixtures/metrics/tracingChild')
    const spans: any[] = []
    child.on('message', pck => {
      if (pck.type !== 'trace-span') return
      expect(pck.data.hasOwnProperty('id')).to.equal(true)
      expect(pck.data.hasOwnProperty('traceId')).to.equal(true)
      spans.push(pck.data)
      if (spans.length === 4) {
        assert(spans.filter(span => span.name === 'http-get').length === 1) // client
        assert(spans.filter(span => span.name === '/toto').length === 1) // server
        assert(spans.filter(span => span.name === 'customspan').length === 1) // custom span using api
        child.kill('SIGKILL')
        return done()
      }
    })
  })
})
