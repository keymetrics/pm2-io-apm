import SpecUtils from './fixtures/utils'
import { expect } from 'chai'
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
      expect(fn).to.equal(null)
    })

    it('should catch uncaught exception and launch callback', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/apiOnExitExceptionChild.js'))

      child.on('message', res => {
        expect(res).to.equal('callback')
        done()
      })
    })
  })
})
