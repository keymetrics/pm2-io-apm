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
        child.kill('SIGKILL')

        expect(pck.data.hasOwnProperty('Network In')).to.equal(true)
        expect(pck.data['Network In'].historic).to.equal(true)

        expect(pck.data.hasOwnProperty('Network Out')).to.equal(true)
        expect(pck.data['Network Out'].historic).to.equal(true)

        done()
      }
    })
  })

  it('should only send upload data', (done) => {
    const child = launch('../fixtures/metrics/networkWithoutDownloadChild')

    child.on('message', pck => {

      if (pck.type === 'axm:monitor' && pck.data['Network Out'] && pck.data['Network Out'].value !== '0 B/sec') {
        child.kill('SIGKILL')

        expect(pck.data.hasOwnProperty('Network Out')).to.equal(true)
        expect(pck.data['Network Out'].historic).to.equal(true)

        expect(pck.data.hasOwnProperty('Open ports')).to.equal(false)
        done()
      }
    })
  })

  it('should only send download data even with amqplib', (done) => {
    const child = launch('../fixtures/metrics/networkWithAmqChild')

    setTimeout(() => {
      child.on('message', pck => {

        if (pck.type === 'axm:monitor') {
          child.kill('SIGKILL')
          expect(pck.data.hasOwnProperty('Network Download')).to.equal(true)

          done()
        }
      })
    }, 1500)
  })
})
