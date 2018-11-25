
import { assert, expect } from 'chai'
import 'mocha'
import * as semver from 'semver'
import { resolve } from 'path'

import { exec, fork } from 'child_process'
import pmx from '../src'

const launch = (fixture) => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: [ '-r', 'ts-node/register' ],
    stdio: [0, 1, 2, 'ipc']
  })
}

describe('API', function () {
  this.timeout(50000)

  describe('Notify', () => {
    it('should receive data from notify', (done) => {
      const child = launch('fixtures/apiNotifyChild.ts')

      child.on('message', msg => {
        if (msg.data.message === 'myNotify') {
          expect(msg.data.message).to.equal('myNotify')
          child.kill('SIGINT')
          done()
        }
      })
    })
  })

  describe('Metrics', () => {
    it('should receive data from metric', (done) => {
      const child = launch('fixtures/apiMetricsChild.ts')

      child.on('message', res => {
        if (res.type === 'axm:monitor') {
          expect(res.data.hasOwnProperty('metric with spaces')).to.equal(true)
          expect(res.data.hasOwnProperty('metric wi!th special chars % ///')).to.equal(true)
          expect(res.data.hasOwnProperty('metricHistogram')).to.equal(true)
          expect(res.data.metricHistogram.value).to.equal(10)
          expect(res.data.metricHistogram.type).to.equal('metric/custom')
          expect(res.data.metricInline.value).to.equal(11)

          child.kill('SIGINT')
          return done()
        }
      })

      child.on('error', done)
    })
  })

  describe('Actions', () => {
    it('should receive data from action', (done) => {
      const child = launch('fixtures/apiActionsChild')

      child.on('message', res => {
        if (res.type === 'axm:action' && res.data.action_name === 'testAction') {
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
      const child = launch('fixtures/apiActionsScopedChild')

      child.on('message', res => {

        if (res.type === 'axm:action' && res.data.action_name === 'testScopedAction') {
          child.send({ action_name: res.data.action_name, uuid: 1000 })
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
      const child = launch('fixtures/apiActionsJsonChild')

      child.on('message', res => {
        if (res.type === 'axm:action' && res.data.action_name === 'testActionWithConf') {
          child.send(res.data.action_name)
        } else if (res.type === 'axm:reply') {
          expect(res.data.action_name).to.equal('testActionWithConf')
          expect(res.data.return.data).to.equal('testActionWithConfReply')
          child.kill('SIGINT')
          done()
        }
      })
    })
  })

  describe('Histogram', () => {
    it('should return an histogram', () => {
      // @ts-ignore
      const firstWay = pmx.histogram('firstWay')
      // @ts-ignore
      const secondWay = pmx.histogram({
        name: 'secondWay'
      })

      expect(firstWay.constructor.name).to.equal('Histogram')
      expect(secondWay.constructor.name).to.equal('Histogram')
    })
  })

  describe('Counter', () => {
    it('should return a counter', () => {
      // @ts-ignore old api
      const firstWay = pmx.counter('firstWay')
      const secondWay = pmx.counter({
        name: 'secondWay'
      })

      expect(firstWay.constructor.name).to.equal('Counter')
      expect(secondWay.constructor.name).to.equal('Counter')
    })
  })

  describe('Meter', () => {
    it('should return a counter', () => {
      // @ts-ignore old api
      const firstWay = pmx.meter('firstWay')
      const secondWay = pmx.meter({
        name: 'secondWay'
      })

      expect(firstWay.constructor.name).to.equal('Meter')
      expect(secondWay.constructor.name).to.equal('Meter')
    })
  })

  describe('Metric', () => {
    it('should return an metric', () => {
      // @ts-ignore old api
      const firstWay = pmx.metric('firstWay')
      const secondWay = pmx.metric({
        name: 'secondWay'
      })

      expect(typeof firstWay.val === 'function').to.equal(true)
      expect(typeof secondWay.val === 'function').to.equal(true)
    })
  })

  describe('onExit', () => {
    it.skip('should catch signals and launch callback', (done) => {
      const child = launch('fixtures/apiOnExitChild')

      child.on('message', res => {
        if (res === 'callback') {
          done()
        }
      })

      setTimeout(function () {
        child.kill('SIGINT')
      }, 1000)

    })

    it('should return null cause no callback provided', () => {
      // @ts-ignore what the fuck is that test
      const fn = pmx.onExit()
      expect(fn).to.equal(undefined)
    })

    it('should catch uncaught exception and launch callback', (done) => {
      const child = launch('fixtures/apiOnExitExceptionChild')

      child.on('message', res => {
        if (res === 'callback') {
          done()
        }
      })
    })
  })

  describe('Compatibility', () => {
    it('should receive data', (done) => {
      const child = launch('fixtures/apiBackwardChild')

      child.on('message', res => {
        if (res.type === 'axm:monitor') {
          expect(res.data.hasOwnProperty('metricBackward')).to.equal(true)
          expect(res.data.metricBackward.value).to.equal(10)

          expect(res.data.hasOwnProperty('counterBackward')).to.equal(true)
          expect(res.data.counterBackward.value).to.equal(2)

          expect(res.data.hasOwnProperty('meterBackward')).to.equal(true)
          expect(res.data.meterBackward.value).to.equal(0)

          expect(res.data.hasOwnProperty('histogramBackward')).to.equal(true)
          expect(res.data.histogramBackward.value).to.equal(0)

          child.kill('SIGINT')
          done()
        }
      })
    })

    it('should return metrics object with clean keys', () => {
      // @ts-ignore
      const metrics = pmx.metrics([
        {
          name: 'metricHistogram',
          type: 'histogram',
          id: 'metric/custom'
        },
        {
          name: 'metric with spaces',
          type: 'histogram',
          id: 'metric/custom'
        },
        {
          name: 'metric wi!th special chars % ///',
          type: 'histogram',
          id: 'metric/custom'
        },
        {
          name: 'metricFailure',
          type: 'notExist'
        }
      ])
      expect(metrics.hasOwnProperty('metricHistogram')).to.equal(true)
      expect(metrics.hasOwnProperty('metric_with_spaces')).to.equal(true)
      expect(metrics.hasOwnProperty('metric_with_special_chars__')).to.equal(true)
      expect(Object.keys(metrics).length).to.equal(3)
    })

    it('should receive data from event', (done) => {
      const child = launch('fixtures/apiBackwardEventChild')

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
      const child = launch('fixtures/apiBackwardNotifyChild')

      child.on('message', msg => {
        if (msg.data.message !== 'test' && msg.data.message !== 'testError' && msg.success) {
          assert.fail()
        }
      })

      child.on('exit', done)
    })

    it('should receive data from expressErrorHandler', (done) => {
      const child = launch('fixtures/apiBackwardExpressChild')

      child.on('message', msg => {
        if (msg === 'expressReady') {
          const httpModule = require('http')
          httpModule.get('http://localhost:3003/error')
        } else if (msg.type === 'process:exception') {
          expect(msg.data.message).to.equal('toto')
          expect(msg.data.metadata.http.path).to.equal('/error')
          expect(msg.data.metadata.http.method).to.equal('GET')
          expect(msg.data.metadata.http.route).to.equal('/error')
          child.kill('SIGINT')
          done()
        }
      })
    })

    it('should enable tracing + metrics', (done) => {
      const child = launch('fixtures/apiBackwardConfChild')
      let tracingDone = false
      let metricsDone = false
      let finished = false

      child.on('message', packet => {

        if (packet.type === 'axm:trace') {
          expect(packet.data.hasOwnProperty('projectId')).to.equal(true)
          expect(packet.data.hasOwnProperty('traceId')).to.equal(true)
          tracingDone = true
        }

        if (packet.type === 'axm:monitor') {
          assert(packet.data['Heap Usage'] !== undefined)
          assert(packet.data['HTTP'] !== undefined)
          assert(packet.data['HTTP Mean Latency'] !== undefined)
          assert(packet.data['HTTP P95 Latency'] !== undefined)
          assert(packet.data['HTTP P95 Latency'].value > packet.data['HTTP Mean Latency'].value)
          metricsDone = true
        }

        if (tracingDone && metricsDone && !finished) {
          finished = true
          child.kill('SIGINT')
          done()
        }
      })
    })
  })

  describe('Compatibility actions', () => {
    const MODULE = semver.satisfies(process.version, '< 8.0.0') ? 'v8-profiler' : 'v8-profiler-node8'

    before(function (done) {
      exec('npm uninstall ' + MODULE, done)
    })

    after(function (done) {
      exec('npm uninstall ' + MODULE, done)
    })

    describe('Profiling', () => {
      it('should receive data for profiling actions', (done) => {
        const child = launch('fixtures/apiBackwardActionsChild')
        const actionDone = new Set<string>()
        let isDone = false

        child.on('message', pck => {

          if (pck.type === 'axm:action') {
            actionDone.add(pck.data.action_name)

            if (actionDone.size >= 6) {
              expect(actionDone.has('km:heap:sampling:start')).to.equal(true)
              expect(actionDone.has('km:heap:sampling:stop')).to.equal(true)
              expect(actionDone.has('km:cpu:profiling:start')).to.equal(true)
              expect(actionDone.has('km:cpu:profiling:stop')).to.equal(true)
              expect(actionDone.has('km:heapdump')).to.equal(true)
              expect(actionDone.has('km:event-loop-dump')).to.equal(true)
              child.kill('SIGINT')

              if (isDone === false) {
                isDone = true
                done()
              }
            }
          }
        })
      })
    })
  })

  describe('InitModule', () => {
    it('should return module conf', () => {
      process.env.mocha = JSON.stringify({
        test: 'processTest',
        bool: true,
        boolAsString: 'true',
        number: '12',
        object: {
          prop1: 'value1'
        }
      })

      const conf = pmx.initModule({
        test2: 'toto'
      })

      expect(conf.test2).to.equal('toto')
      expect(conf.module_conf.test).to.equal('processTest')
      expect(conf.module_conf.bool).to.equal(true)
      expect(conf.module_conf.boolAsString).to.equal(true)
      expect(typeof conf.module_conf.number).to.equal('number')
      expect(conf.module_conf.number).to.equal(12)
      expect(typeof conf.module_conf.object).to.equal('object')
      expect(conf.module_conf.object.prop1).to.equal('value1')

      expect(conf.module_name).to.equal('mocha')
      expect(typeof conf.module_version).to.equal('string')
      expect(typeof conf.module_name).to.equal('string')
      expect(typeof conf.description).to.equal('string')
      expect(typeof conf.pmx_version).to.equal('string')
    })

    it('should return module conf with callback', () => {
      process.env.mocha = JSON.stringify(new Date())

      pmx.initModule({
        test2: 'toto'
      }, (err, conf) => {
        expect(typeof conf.module_conf).to.equal('object')
        expect(typeof conf.module_version).to.equal('string')
        expect(typeof conf.module_name).to.equal('string')
        expect(typeof conf.description).to.equal('string')
        expect(typeof conf.pmx_version).to.equal('string')
        expect(conf.test2).to.equal('toto')
        expect(conf.module_name).to.equal('mocha')
        expect(err).to.equal(null)
      })
    })

    it('should return minimal conf', () => {
      // @ts-ignore
      const conf = pmx.initModule()
      expect(conf.module_name).to.equal('mocha')
      expect(typeof conf.module_version).to.equal('string')
      expect(typeof conf.module_name).to.equal('string')
      expect(typeof conf.description).to.equal('string')
      expect(typeof conf.pmx_version).to.equal('string')
    })

    it('should receive data from init module', (done) => {
      const child = launch('fixtures/apiInitModuleChild')

      child.on('message', pck => {
        if (pck.type === 'axm:option:configuration' && pck.data.module_name === 'fixtures') {
          const conf = pck.data
          expect(conf.module_version).to.equal('0.0.1')
          expect(typeof conf.module_name).to.equal('string')
          expect(typeof conf.pmx_version).to.equal('string')
          child.kill('SIGINT')
          done()
        }
      })
    })
  })

  describe('Multiple instantiation', () => {
    it('should retrieve config of the previous instantiation', () => {

      pmx.init({ metrics: { v8: true } })
      let conf = pmx.getInitialConfig()
      expect(conf.metrics.v8).to.equal(true)
      expect(conf.metrics.transaction).to.equal(undefined)

      pmx.init({ metrics: { transaction: { http: false } } })
      conf = pmx.getInitialConfig()

      expect(conf.metrics.v8).to.equal(undefined)
      expect(conf.metrics.transaction.http).to.equal(false)

      pmx.destroy()
    })
  })
})
