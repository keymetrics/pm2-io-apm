import {expect, assert} from 'chai'
import 'mocha'

import SpecUtils from '../fixtures/utils'
import {fork, exec} from 'child_process'

describe('Worker', function () {
  this.timeout(5000)
  it('should send all data with v8 heap info', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/metrics/workerChild.js'))

    child.on('message', pck => {

      if (pck.type === 'axm:monitor') {

        expect(pck.data.hasOwnProperty('Child processes')).to.equal(true)
        expect(pck.data['Child processes'].value).to.equal(2)

        child.kill('SIGINT')
        done()
      }
    })
  })
})
