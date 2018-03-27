import SpecUtils from '../fixtures/utils'
import { expect } from 'chai'
import { fork, exec } from 'child_process'
import Inspector from '../../src/actions/eventLoopInspector'
import Action from '../../src/features/actions'

const MODULE = 'event-loop-inspector'

describe('EventLoopInspector', function () {
  this.timeout(10000)

  describe('Event loop inspector module', function () {
    before(function (done) {
      exec('npm install ' + MODULE, function (err) {
        expect(err).to.equal(null)
        setTimeout(done, 1000)
      })
    })

    after(function (done) {
      exec('npm uninstall ' + MODULE, done)
    })

    it('should get event loop data', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/actions/eventLoopInspectorChild.js'))

      child.on('message', res => {

        if (res.type === 'axm:reply') {

          expect(res.data.return.success).to.equal(true)
          expect(typeof res.data.return.dump).to.equal('object')

          child.kill('SIGINT')
          done()
        }
      })

      setTimeout(function () {
        child.send('km:event-loop-dump')
      }, 2000)
    })
  })

  describe('Event loop inspector module not install', function () {

    before(function (done) {
      exec('npm uninstall ' + MODULE, done)
    })

    it('should return false cause module is not present', async () => {
      const action = new Action()
      action.init()

      const eventLoopInspector = new Inspector(action)

      await eventLoopInspector.eventLoopDump().catch((e) => {
        expect(e.message).to.equal('event-loop-inspector not found')
      })
    })
  })
})
