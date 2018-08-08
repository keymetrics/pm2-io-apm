import {expect, assert} from 'chai'
import 'mocha'

import SpecUtils from '../fixtures/utils'
import {fork, exec} from 'child_process'

describe('File requests', function () {
  this.timeout(50000)
  it('should get number of file requests', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/metrics/FSChild.js'))

    child.on('message', pck => {

      if (pck.type === 'axm:monitor') {

        expect(pck.data.hasOwnProperty('Files requests')).to.equal(true)
        expect(pck.data['Files requests'].value > 0).to.equal(true)

        child.kill('SIGINT')
        done()
      }
    })
  })
})
