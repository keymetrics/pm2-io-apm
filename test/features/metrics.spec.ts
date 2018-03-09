import { expect, assert } from 'chai'
import 'mocha'

import Metric from '../../src/features/metrics'

describe('Metrics', () => {
  describe('meter', () => {
    it('should calculate a meter', (done) => {
      const metric = new Metric()

      const meter = metric.meter({tickInterval: 50})

      expect(meter.val()).to.equal(0)

      setTimeout(function () {
        expect(meter.val()).to.equal(0)
        done()
      }, 60)
    })

    it('should calculate a meter after mark', (done) => {
      const metric = new Metric()

      const meter = metric.meter({tickInterval: 50})

      expect(meter.val()).to.equal(0)

      meter.mark(10)

      setTimeout(function () {
        expect(meter.val()).to.equal(0.17)
        done()
      }, 60)
    })
  })
})
