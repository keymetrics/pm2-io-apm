
import { assert, expect } from 'chai'
import 'mocha'
import * as semver from 'semver'
import { resolve } from 'path'

import { exec, fork } from 'child_process'
import * as pmx from '../src'
import { MetricType } from '../src/services/metrics'

const launch = (fixture) => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: process.env.NYC_ROOT_ID ? process.execArgv : [ '-r', 'ts-node/register' ]
  })
}

describe('API', function () {
  this.timeout(10000)

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
          // both metrics aren't used
          expect(res.data.hasOwnProperty('metric with spaces')).to.equal(false)
          expect(res.data.hasOwnProperty('metric wi!th special chars % ///')).to.equal(false)
          expect(res.data.hasOwnProperty('metricHistogram')).to.equal(true)
          expect(res.data.hasOwnProperty('metricInline')).to.equal(true)
          expect(res.data.hasOwnProperty('toto')).to.equal(true)
          expect(res.data.metricHistogram.value).to.equal(10)
          expect(res.data.metricHistogram.type).to.equal('metric/custom')
          expect(res.data.metricInline.value).to.equal(11)
          expect(res.data.toto.value).to.equal(42)

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

    it.skip('should catch uncaught exception and launch callback', (done) => {
      const child = launch('fixtures/apiOnExitExceptionChild')
      var callbackReceived = false

      child.on('message', res => {
        if (res.type === 'process:exception') {
          assert(!!res.data.message.match(/Cannot read property/))
        }
        if (res === 'callback' && !callbackReceived) {
          callbackReceived = true
          done()
        }
      })
    })
  })

  describe('Compatibility', () => {

    it('should return metrics object with clean keys', () => {
      // @ts-ignore
      const metrics = pmx.metrics([
        {
          name: 'metricHistogram',
          type: MetricType.histogram,
          id: 'metric/custom'
        },
        {
          name: 'metric with spaces',
          type: MetricType.histogram,
          id: 'metric/custom'
        },
        {
          name: 'metric wi!th special chars % ///',
          type: MetricType.histogram,
          id: 'metric/custom'
        },
        {
          name: 'metricFailure',
          type: 'notExist' as any
        }
      ])
      expect(metrics[0].constructor.name === 'Histogram').to.equal(true)
      expect(metrics[1].constructor.name === 'Histogram').to.equal(true)
      expect(metrics[2].constructor.name === 'Histogram').to.equal(true)
      expect(metrics[3].constructor.name === 'Object').to.equal(true)
      expect(Object.keys(metrics).length).to.equal(4)
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

    it('should receive data from koaErrorHandler', (done) => {
      if (semver.satisfies(process.version, '<= 6.0.0')) return done()
      const child = launch('fixtures/apiKoaErrorHandler')

      child.on('message', msg => {
        if (msg === 'ready') {
          const httpModule = require('http')
          httpModule.get('http://localhost:3003/error')
        } else if (msg.type === 'process:exception') {
          expect(msg.data.message).to.equal('toto')
          expect(msg.data.metadata.http.path).to.equal('/error')
          expect(msg.data.metadata.http.method).to.equal('GET')
          child.kill('SIGINT')
          done()
        }
      })
    })

    it('should not make errors swallowed when koaErrorHandler is used', (done) => {
      if (semver.satisfies(process.version, '<= 6.0.0')) return done()
      const child = launch('fixtures/apiKoaErrorHandler')

      child.on('message', msg => {
        if (msg === 'ready') {
          const httpModule = require('http')
          httpModule.get('http://localhost:3003/error', ({ statusCode }) => {
            expect(statusCode).to.equal(500)
            child.kill('SIGINT')
            done()
          })
        }
      })
    })

    it.skip('should enable tracing + metrics', (done) => {
      const child = launch('fixtures/apiBackwardConfChild')
      let tracingDone = false
      let metricsDone = false
      let finished = false

      child.on('message', packet => {

        if (packet.type === 'trace-span') {
          expect(packet.data.hasOwnProperty('id')).to.equal(true)
          expect(packet.data.hasOwnProperty('traceId')).to.equal(true)
          tracingDone = true
        }

        if (packet.type === 'axm:monitor') {
          assert(packet.data['Heap Usage'] !== undefined)
          if (packet.data['HTTP'] !== undefined) {
            assert(packet.data['HTTP Mean Latency'] !== undefined)
            assert(packet.data['HTTP P95 Latency'] !== undefined)
            metricsDone = true
          }
        }

        if (tracingDone && metricsDone && !finished) {
          finished = true
          child.kill('SIGINT')
          done()
        }
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
      expect(conf.apm.type).to.equal('node')
      expect(typeof conf.apm.version).to.equal('string')
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
        expect(conf.apm.type).to.equal('node')
        expect(typeof conf.apm.version).to.equal('string')
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
      expect(conf.apm.type).to.equal('node')
      expect(typeof conf.apm.version).to.equal('string')
    })

    it('should receive data from init module', (done) => {
      const child = launch('fixtures/apiInitModuleChild')

      child.on('message', pck => {
        if (pck.type === 'axm:option:configuration' && pck.data.module_name === 'fixtures') {
          const conf = pck.data
          expect(conf.module_version).to.equal('0.0.1')
          expect(typeof conf.module_name).to.equal('string')
          expect(conf.apm.type).to.equal('node')
          expect(typeof conf.apm.version).to.equal('string')
          child.kill('SIGINT')
          done()
        }
      })
    })
  })

  describe('Multiple instantiation', () => {
    it('should retrieve config of the previous instantiation', () => {

      pmx.init({ metrics: { v8: true } })
      let conf = pmx.getConfig()
      // @ts-ignore
      expect(conf.metrics.v8).to.equal(true)
      // @ts-ignore
      expect(conf.metrics.http).to.equal(undefined)

      pmx.init({ metrics: { http: false } })
      conf = pmx.getConfig()

      // @ts-ignore
      expect(conf.metrics.v8).to.equal(undefined)
      // @ts-ignore
      expect(conf.metrics.http).to.equal(false)

      pmx.destroy()
    })
  })
})
