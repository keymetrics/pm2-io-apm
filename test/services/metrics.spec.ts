
import { InternalMetric, MetricService, MetricMeasurements } from '../../src/services/metrics'
import { IPCTransport } from '../../src/transports/IPCTransport'
import { ServiceManager } from '../../src/serviceManager'
import * as assert from 'assert'

describe('MetricsService', function () {
  this.timeout(5000)

  const transport = new IPCTransport()
  transport.init()
  ServiceManager.set('transport', transport)
  const service = new MetricService()
  service.init()

  describe('basic', () => {
    it('register gauge', (done) => {
      transport.setMetrics = function (metrics: InternalMetric[]) {
        const gauge = metrics.find(metric => metric.name === 'gauge')
        assert(gauge !== undefined)
        return done()
      }
      const gauge = service.metric({
        name: 'gauge'
      })
      gauge.set(10)
    })
    it('register meter', (done) => {
      transport.setMetrics = function (metrics: InternalMetric[]) {
        const meter = metrics.find(metric => metric.name === 'meter')
        assert(meter !== undefined)
        return done()
      }
      const meter = service.meter({
        name: 'meter'
      })
      meter.mark()
    })
    it('register histogram', (done) => {
      transport.setMetrics = function (metrics: InternalMetric[]) {
        const histogram = metrics.find(metric => metric.name === 'histogram')
        assert(histogram !== undefined)
        return done()
      }
      const histogram = service.histogram({
        name: 'histogram',
        measurement: MetricMeasurements.min
      })
      histogram.update(10000)
    })
    it('register counter', (done) => {
      transport.setMetrics = function (metrics: InternalMetric[]) {
        const counter = metrics.find(metric => metric.name === 'counter')
        assert(counter !== undefined)
        return done()
      }
      const counter = service.counter({
        name: 'counter'
      })
      counter.inc()
    })
    it('should send value for all metrics', (done) => {
      transport.setMetrics = function (metrics: InternalMetric[]) {
        const counter = metrics.find(metric => metric.name === 'counter')
        const histogram = metrics.find(metric => metric.name === 'histogram')
        const meter = metrics.find(metric => metric.name === 'meter')
        const gauge = metrics.find(metric => metric.name === 'gauge')
        assert(counter !== undefined && counter.value === 1)
        assert(meter !== undefined)
        // @ts-ignore
        assert(histogram !== undefined && histogram.value > 0)
        assert(gauge !== undefined && gauge.value === 10)
        return done()
      }
    })
  })
})
