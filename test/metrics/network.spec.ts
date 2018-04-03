import { expect, assert } from 'chai'
import 'mocha'

import SpecUtils from '../fixtures/utils'
import { fork, exec } from 'child_process'

describe('Network', function () {
  this.timeout(5000)

  it('should send network data', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/features/networkChild.js'))

    child.on('message', pck => {

      if (pck.type === 'axm:monitor' && pck.data['Network Download'].value !== '0 B/sec') {

        expect(pck.data.hasOwnProperty('Network Download')).to.equal(true)
        expect(pck.data['Network Download'].agg_type).to.equal('sum')
        expect(pck.data['Network Download'].historic).to.equal(true)
        expect(pck.data['Network Download'].type).to.equal('Network Download')

        expect(pck.data.hasOwnProperty('Network Upload')).to.equal(true)
        expect(pck.data['Network Upload'].agg_type).to.equal('sum')
        expect(pck.data['Network Upload'].historic).to.equal(true)
        expect(pck.data['Network Upload'].type).to.equal('Network Upload')

        expect(pck.data.hasOwnProperty('Open ports')).to.equal(true)
        expect(pck.data['Open ports'].value).to.equal('3002')
        expect(pck.data['Open ports'].agg_type).to.equal('avg')
        expect(pck.data['Open ports'].historic).to.equal(true)
        expect(pck.data['Open ports'].type).to.equal('Open ports')

        child.kill('SIGINT')
        done()
      }
    })
  })
})
