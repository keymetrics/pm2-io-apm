import { expect, assert } from 'chai'
import 'mocha'

import Probe from '../../src/features/probe'

describe('Probe', () => {
  describe('meter', () => {
    it('should calulate a meter', (done) => {
      const probe = new Probe()

      const meter = probe.meter({tickInterval: 50})

      expect(meter.val()).to.equal(0)

      //meter.mark(10)

      setTimeout(function () {
        expect(meter.val()).to.equal(0)
        done()
      }, 60)
    })

    it('should calulate a meter after mark', (done) => {
      const probe = new Probe()

      const meter = probe.meter({tickInterval: 50})

      expect(meter.val()).to.equal(0)

      meter.mark(10)

      setTimeout(function () {
        expect(meter.val()).to.equal(0.17)
        done()
      }, 60)
    })
  })
})
