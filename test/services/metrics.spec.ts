import { expect } from 'chai'

import MetricsService from '../../src/services/metrics'
import MetricsFeature from '../../src/features/metrics'
import V8Metric from '../../src/metrics/v8'
import EventLoopDelayMetric from '../../src/metrics/eventLoopDelay'

describe('MetricsService', () => {

  describe('init', () => {
    it('Should not fail if unknown service is found in conf', () => {
      const metricFeature = new MetricsFeature()
      const service = new MetricsService(metricFeature)

      service.init({
        v8: true,
        toto: true,
        transaction: false
      })

      expect(service.get('v8') instanceof V8Metric).to.equal(true)
      expect(service.get('eventLoopDelay') instanceof EventLoopDelayMetric).to.equal(true)
      expect(service.get('toto')).to.equal(null)

      service.destroyAll()
    })
  })
})
