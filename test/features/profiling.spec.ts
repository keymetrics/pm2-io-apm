import { exec, fork } from 'child_process'
import { expect, assert } from 'chai'
import 'mocha'
import SpecUtils from '../fixtures/utils'
import ProfilingFeature from '../../src/features/profiling'
import * as semver from 'semver'
import * as fs from 'fs'

const MODULE = 'v8-profiler-node8'

describe('ProfilingFeature', function () {
  this.timeout(20000)

  after(function (done) {
    exec('npm uninstall ' + MODULE, done)
  })

  describe('CPU', () => {
    before(function (done) {
      exec('npm install ' + MODULE, function (err) {
        expect(err).to.equal(null)
        setTimeout(done, 1000)
      })
    })

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

    it('should get CPU profile from v8-profiler module', async () => {
      const profiling = new ProfilingFeature().init(true)

      await profiling.cpuProfiling.init()
      profiling.cpuProfiling.start()

      await setTimeoutCpuProfile(profiling)
    })
  })
})

function setTimeoutCpuProfile (profiling) {
  return new Promise( (resolve, reject) => {
    setTimeout( async () => {
      const res = await profiling.cpuProfiling.stop()

      const content = JSON.parse(fs.readFileSync(res, 'utf8'))
      expect(typeof content).to.equal('object')
      expect(content.typeId).to.equal('CPU')

      profiling.cpuProfiling.destroy()
      resolve()
    }, 500)
  })

}
