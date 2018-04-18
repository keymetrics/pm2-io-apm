import SpecUtils from './fixtures/utils'
import { assert, expect } from 'chai'
import * as chai from 'chai'
import 'mocha'

import { fork } from 'child_process'

describe('API', function () {
  this.timeout(5000)

  describe('Notify', () => {
    it('should receive data from notify', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/apiNotifyChild.js'))

      child.on('message', msg => {
        if (msg === 'myNotify') {
          expect(msg).to.equal('myNotify')
          child.kill('SIGINT')
          done()
        }
      })
    })
  })

  describe('Metrics', () => {
    it('should receive data from metric', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/apiMetricsChild.js'))

      child.on('message', res => {

        if (res.type === 'axm:monitor') {
          expect(res.data.hasOwnProperty('metricHistogram')).to.equal(true)
          expect(res.data.metricHistogram.value).to.equal('10')
          expect(res.data.metricHistogram.type).to.equal('metric/custom')
          expect(res.data.hasOwnProperty('Loop delay')).to.equal(true)
          expect(res.data.hasOwnProperty('Active handles')).to.equal(true)

          if (res.data.hasOwnProperty('New space used size')) {
            child.kill('SIGINT')
            done()
          }
        }
      })
    })
  })

  describe('Actions', () => {
    it('should receive data from action', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/apiActionsChild.js'))

      child.on('message', res => {

        if (res.type === 'axm:action') {
          expect(res.data.action_name).to.equal('testAction')
          child.send(res.data.action_name)
        } else if (res.type === 'axm:reply') {
          expect(res.data.action_name).to.equal('testAction')
          expect(res.data.return.data).to.equal('testActionReply')
          child.kill('SIGINT')
          done()
        }
      })
    })

    it('should receive data from scoped action', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/apiActionsScopedChild.js'))

      child.on('message', res => {

        if (res.type === 'axm:action') {
          expect(res.data.action_name).to.equal('testScopedAction')
          child.send(res.data.action_name)
          child.send({action_name: res.data.action_name, uuid: 1000})
        } else if (res.type === 'axm:scoped_action:stream') {
          expect(res.data.uuid).to.equal(1000)
          expect(res.data.action_name).to.equal('testScopedAction')
          expect(res.data.data).to.equal('testScopedActionReply')
          child.kill('SIGINT')
          done()
        }
      })
    })

    it('should receive data from action with conf', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/apiActionsJsonChild.js'))

      child.on('message', res => {

        if (res.type === 'axm:action') {
          expect(res.data.action_name).to.equal('testActionWithConf')
          child.send(res.data.action_name)
          child.send({action_name: res.data.action_name, uuid: 1000})
        } else if (res.type === 'axm:reply') {
          expect(res.data.action_name).to.equal('testActionWithConf')
          expect(res.data.return.data).to.equal('testActionWithConfReply')
          child.kill('SIGINT')
          done()
        }
      })
    })
  })

  describe('Transpose', () => {
    it('should receive data from transpose', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/apiTransposeChild.js'))

      child.on('message', res => {
        if (res.type === 'axm:monitor') {
          expect(res.data.hasOwnProperty('transpose')).to.equal(true)
          expect(res.data.transpose.value).to.equal('transposeResponse')
          expect(res.data.hasOwnProperty('Loop delay')).to.equal(true)
          expect(res.data.hasOwnProperty('Active handles')).to.equal(true)

          child.kill('SIGINT')
          done()
        }
      })
    })
  })

  describe('Onexit', () => {
    it('should catch signals and launch callback', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/apiOnExitChild.js'))

      child.on('message', res => {
        expect(res).to.equal('callback')
        done()
      })

      setTimeout(function () {
        child.kill('SIGINT')
      }, 500)

    })

    it('should return null cause no callback provided', () => {
      const pmx = require(__dirname + '/../build/main/src/index.js')
      const fn = pmx.onExit()
      expect(fn).to.equal(undefined)
    })

    it('should catch uncaught exception and launch callback', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/apiOnExitExceptionChild.js'))

      child.on('message', res => {
        expect(res).to.equal('callback')
        done()
      })
    })
  })

  describe('Compatibility', () => {
    it('should receive data', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/apiBackwardChild.js'))

      child.on('message', res => {
        if (res.type === 'axm:monitor') {
          expect(res.data.hasOwnProperty('metricBackward')).to.equal(true)
          expect(res.data.metricBackward.value).to.equal(10)

          expect(res.data.hasOwnProperty('counterBackward')).to.equal(true)
          expect(res.data.counterBackward.value).to.equal(2)

          expect(res.data.hasOwnProperty('meterBackward')).to.equal(true)
          expect(res.data.meterBackward.value).to.equal('0')

          expect(res.data.hasOwnProperty('histogramBackward')).to.equal(true)
          expect(res.data.histogramBackward.value).to.equal('0')

          expect(res.data.hasOwnProperty('Loop delay')).to.equal(true)
          expect(res.data.hasOwnProperty('Active handles')).to.equal(true)

          child.kill('SIGINT')
          done()
        }
      })
    })

    it('should return null', () => {
      const pmx = require(__dirname + '/../build/main/src/index.js')
      const probe = pmx.probe()

      const metric = probe.metric()
      expect(metric).to.equal(null)
    })

    it('should receive data from event', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/apiBackwardEventChild.js'))

      child.on('message', res => {
        if (res.type === 'human:event') {
          expect(res.data.__name).to.equal('myEvent')
          expect(res.data.prop1).to.equal('value1')

          child.kill('SIGINT')
          done()
        }
      })
    })

    it('should receive data from notify', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/apiBackwardNotifyChild.js'))

      child.on('message', msg => {
        if (msg !== 'test' && msg !== 'testError' && msg.success) {
          assert.fail()
        }
      })

      child.on('exit', () => {
        done()
      })
    })
  })
})
