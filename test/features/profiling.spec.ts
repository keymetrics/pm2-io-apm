import { fork } from 'child_process'
import { expect, assert } from 'chai'
import 'mocha'
import SpecUtils from '../fixtures/utils'
import ProfilingFeature from '../../src/features/profiling'
import * as semver from 'semver'
import * as fs from 'fs'

describe('ProfilingFeature', function () {
  this.timeout(5000)
  describe('CPU', () => {
    it('should get CPU profile from inspector', (done) => {
      const profiling = new ProfilingFeature().init()

      profiling.cpuProfiling.init()

      profiling.cpuProfiling.start()

      setTimeout(async () => {
        const res = await profiling.cpuProfiling.stop()

        const content = JSON.parse(fs.readFileSync(res, 'utf8'))

        if (semver.satisfies(process.version, '>= 8.0.0')) {
          expect(content.hasOwnProperty('nodes')).to.equal(true)
          expect(content.hasOwnProperty('startTime')).to.equal(true)
          expect(content.hasOwnProperty('endTime')).to.equal(true)
        } else {
          expect(typeof content).to.equal('object')
          expect(content.typeId).to.equal('CPU')
        }

        profiling.cpuProfiling.destroy()
        done()
      }, 500)
    })

    it('should get CPU profile from v8-profiler module', (done) => {
      const profiling = new ProfilingFeature().init(true)

      profiling.cpuProfiling.init()

      profiling.cpuProfiling.start()

      setTimeout(async () => {
        const res = await profiling.cpuProfiling.stop()

        const content = JSON.parse(fs.readFileSync(res, 'utf8'))
        expect(typeof content).to.equal('object')
        expect(content.typeId).to.equal('CPU')

        profiling.cpuProfiling.destroy()
        done()
      }, 500)
    })
  })
})
