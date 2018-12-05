import { expect, assert } from 'chai'
import { fork } from 'child_process'
import { resolve } from 'path'

const launch = (fixture) => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: [ '-r', 'ts-node/register' ]
  })
}

describe('Network', function () {
  this.timeout(10000)

  it('should send network data', (done) => {
    const child = launch('../fixtures/metrics/networkChild')

    child.on('message', pck => {

      if (pck.type === 'axm:monitor' && pck.data['Network Out']) {
        expect(pck.data.hasOwnProperty('Network In')).to.equal(true)
        expect(pck.data['Network In'].historic).to.equal(true)

        expect(pck.data.hasOwnProperty('Network Out')).to.equal(true)
        expect(pck.data['Network Out'].historic).to.equal(true)

        child.kill('SIGINT')
        done()
      }
    })
  })

  it('should only send upload data', (done) => {
    const child = launch('../fixtures/metrics/networkWithoutDownloadChild')

    let called = false
    child.on('message', pck => {
      if (called === true) return
      called = true

      if (pck.type === 'axm:monitor' && pck.data['Network Out']) {

        expect(pck.data.hasOwnProperty('Network Out')).to.equal(true)
        expect(pck.data['Network Out'].historic).to.equal(true)

        expect(pck.data.hasOwnProperty('Open ports')).to.equal(false)

        child.kill('SIGINT')
        done()
      }
    })
  })

  it('should only send download data even with amqplib', (done) => {
    const child = launch('../fixtures/metrics/networkWithAmqChild')

    let called = false
    setTimeout(() => {
      if (called === true) return
      called = true
      child.on('message', pck => {

        if (pck.type === 'axm:monitor') {
          expect(pck.data.hasOwnProperty('Network Download')).to.equal(true)
          child.kill('SIGINT')
        }
      })
    }, 1500)

    child.on('exit', () => {
      done()
    })
  })
})
