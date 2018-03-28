import { expect, assert } from 'chai'
import 'mocha'

import SpecUtils from '../fixtures/utils'
import { fork, exec } from 'child_process'

describe('EventLoopDelay', function () {
  it('should send event loop delay', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/features/eventLoopDelayChild.js'))

    child.on('message', pck => {

      if (pck.type === 'axm:monitor') {

console.log(pck)
        child.kill('SIGINT')
        done()
      }
    })
  })
})
