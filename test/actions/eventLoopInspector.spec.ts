import SpecUtils from '../fixtures/utils'
import { expect, assert } from 'chai'
import { fork, exec } from 'child_process'

describe('EventLoopInspector', function () {
  this.timeout(20000)

  describe('Event loop inspector module', function () {

    it('should get event loop data', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/actions/eventLoopInspectorChild.js'))

      child.on('message', res => {

        if (res.type === 'axm:action') {
          expect(res.data.action_type).to.equal('internal')
        }

        if (res.type === 'axm:reply') {

          expect(res.data.return.success).to.equal(true)
          expect(typeof res.data.return.dump).to.equal('object')
          child.kill('SIGINT')
        }
      })

      child.on('exit', function () {
        done()
      })

      const timer = setTimeout(function () {
        child.send('km:event-loop-dump')
        clearTimeout(timer)
      }, 2000)
    })
  })
})
