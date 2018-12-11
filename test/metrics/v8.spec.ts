import { expect, assert } from 'chai'
import { fork, exec } from 'child_process'
import { resolve } from 'path'

const launch = (fixture) => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: process.env.NYC_ROOT_ID ? process.execArgv : [ '-r', 'ts-node/register' ]
  })
}

describe('V8', function () {
  this.timeout(5000)
  it('should send all data with v8 heap info', (done) => {
    const child = launch('../fixtures/metrics/gcv8Child.ts')
    let receive = false

    child.on('message', pck => {

      if (pck.type === 'axm:monitor' && receive === false) {
        receive = true
        expect(Number.isInteger(pck.data['Heap size'].value)).to.equal(true)
        expect(Number.isInteger(pck.data['Used heap size'].value)).to.equal(true)
        expect(pck.data['Heap Usage'].value).to.not.equal(undefined)

        child.kill('SIGINT')
        done()
      }
    })
  })
})
