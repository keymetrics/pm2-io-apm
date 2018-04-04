import { fork } from 'child_process'
import { expect, assert } from 'chai'
import 'mocha'
import SpecUtils from '../fixtures/utils'
import ProfilingFeature from '../../src/features/profiling'

describe('ProfilingFeature', () => {
  describe('CPU', () => {
    it('should get data from CPU profiler', (done) => {
      const profiling = new ProfilingFeature().init()

      profiling.cpuProfiling.init()

      profiling.cpuProfiling.start()

      setTimeout(() => {
        profiling.cpuProfiling.stop()
        profiling.cpuProfiling.destroy()
        done()
      }, 1000)
    })
  })
})
