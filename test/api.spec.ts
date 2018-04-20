import SpecUtils from './fixtures/utils'
import { assert, expect } from 'chai'
import * as chai from 'chai'
import 'mocha'

import {exec, fork} from 'child_process'

describe('API', function () {
  this.timeout(50000)

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

    it('should receive data with old config', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/apiBackwardConfChild.js'))
      let tracingDone = false
      let metricsDone = false

      child.on('message', pck => {

        if (pck.type === 'axm:trace') {
          expect(pck.data.hasOwnProperty('projectId')).to.equal(true)
          expect(pck.data.hasOwnProperty('traceId')).to.equal(true)
          tracingDone = true
        }

        if (pck.data.hasOwnProperty('New space used size')) {
          expect(pck.data.hasOwnProperty('New space used size')).to.equal(true)
          expect(pck.data.hasOwnProperty('Network Download')).to.equal(true)
          expect(pck.data.hasOwnProperty('Network Upload')).to.equal(true)
          expect(pck.data.hasOwnProperty('Open ports')).to.equal(true)
          expect(pck.data.hasOwnProperty('HTTP: Response time')).to.equal(true)
          metricsDone = true
        }

        if (tracingDone && metricsDone) {
          child.kill('SIGINT')
          done()
        }
      })
    })
  })

  describe('Compatibility actions', () => {
    const MODULE = 'v8-profiler'

    before(function (done) {
      exec('npm uninstall ' + MODULE, done)
    })

    after(function (done) {
      exec('npm uninstall ' + MODULE, done)
    })

    describe('Profiling', () => {
      before(function (done) {
        exec('npm install ' + MODULE, function (err) {
          expect(err).to.equal(null)
          setTimeout(done, 1000)
        })
      })

      it('should receive data from default actions', (done) => {
        const child = fork(SpecUtils.buildTestPath('fixtures/apiBackwardActionsChild.js'))
        const actionDone: Array<string> = []

        child.on('message', pck => {

          if (pck.type === 'axm:action') {
            if (actionDone.indexOf(pck.data.action_name) === -1) {
              actionDone.push(pck.data.action_name)
            }

            if (actionDone.length === 5) {
              expect(actionDone.indexOf('km:heap:sampling:start') > -1).to.equal(true)
              expect(actionDone.indexOf('km:heap:sampling:stop') > -1).to.equal(true)
              expect(actionDone.indexOf('km:cpu:profiling:start') > -1).to.equal(true)
              expect(actionDone.indexOf('km:cpu:profiling:stop') > -1).to.equal(true)
              expect(actionDone.indexOf('km:heapdump') > -1).to.equal(true)
              child.kill('SIGINT')
              done()
            }
          }
        })
      })
    })
  })
})
