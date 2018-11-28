import { expect, assert } from 'chai'
import { fork, exec } from 'child_process'
import { resolve } from 'path'

const launch = (fixture) => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: [ '-r', 'ts-node/register' ]
  })
}

describe('V8', function () {
  this.timeout(5000)
  it('should send all data with v8 heap info', (done) => {
    const child = launch('../fixtures/metrics/v8Child')
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

describe('GC', function () {
  this.timeout(50000)

  before(function (done) {
    exec('npm install gc-stats', function (err) {
      expect(err).to.equal(null)
      setTimeout(done, 1000)
    })
  })

  after(function (done) {
    exec('npm uninstall gc-stats', function (err) {
      expect(err).to.equal(null)
      done()
    })
  })

  it('should get GC stats', (done) => {
    const child = launch('../fixtures/metrics/v8Child')

    child.on('message', pck => {

      if (pck.type === 'axm:monitor' && pck.data['GC Type']) {
        expect(pck.data.hasOwnProperty('GC Type')).to.equal(true)
        child.kill('SIGKILL')
        done()
      }
    })
  })
})
