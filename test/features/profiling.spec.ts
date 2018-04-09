import { exec, fork } from 'child_process'
import { expect, assert } from 'chai'
import 'mocha'
import SpecUtils from '../fixtures/utils'
import ProfilingFeature from '../../src/features/profiling'
import * as semver from 'semver'
import * as fs from 'fs'

const MODULE = 'v8-profiler-node8'

describe('ProfilingFeature', function () {
  this.timeout(50000)

  after(function (done) {
    exec('npm uninstall ' + MODULE, done)
  })

  describe('Profiling without module', () => {
    it('Should fail on heap profiling cause no profiler install', async () => {
      const profiling = new ProfilingFeature().init(true)

      try {
        await profiling.heapProfiling.init()
      } catch (e) {
        expect(e.message.indexOf('Profiler not loaded !')).to.equal(0)
      }
    })

    it('Should fail on CPU profiling cause no profiler install', async () => {
      const profiling = new ProfilingFeature().init(true)

      try {
        await profiling.cpuProfiling.init()
      } catch (e) {
        expect(e.message.indexOf('Profiler not loaded !')).to.equal(0)
      }
    })
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

      await setTimeoutCPUProfile(profiling)
    })
  })

  describe('Heap', () => {
    before(function (done) {
      exec('npm install ' + MODULE, function (err) {
        expect(err).to.equal(null)
        setTimeout(done, 1000)
      })
    })

    it('should get Heap profile from inspector', (done) => {
      const profiling = new ProfilingFeature().init()

      profiling.heapProfiling.init()

      profiling.heapProfiling.start()

      setTimeout(async () => {
        const res = await profiling.heapProfiling.stop()

        const content = JSON.parse(fs.readFileSync(res, 'utf8'))

        if (semver.satisfies(process.version, '>= 8.0.0')) {
          expect(typeof content).to.equal('object')
          expect(content.hasOwnProperty('head')).to.equal(true)
        } else {
          expect(typeof content).to.equal('object')
          expect(content.hasOwnProperty('snapshot')).to.equal(true)
        }

        profiling.heapProfiling.destroy()
        done()
      }, 500)
    })

    it('should get Heap snapshot', async () => {
      const profiling = new ProfilingFeature().init()
      profiling.heapProfiling.init()
      const res = await profiling.heapProfiling.takeSnapshot()

      const content = JSON.parse(fs.readFileSync(res, 'utf8'))

      if (semver.satisfies(process.version, '>= 8.0.0')) {
        expect(typeof content).to.equal('object')
        expect(content.hasOwnProperty('snapshot')).to.equal(true)
      }

      profiling.heapProfiling.destroy()
    })

    it('should get Heap profile from v8-profiler module', async () => {
      const profiling = new ProfilingFeature().init(true)

      await profiling.heapProfiling.init()

      await setTimeoutProfile(profiling)
    })
  })
})

function setTimeoutCPUProfile (profiling) {
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

function setTimeoutProfile (profiling) {
  return new Promise( (resolve, reject) => {
    setTimeout( async () => {
      const res = await profiling.heapProfiling.takeSnapshot()

      const content = JSON.parse(fs.readFileSync(res, 'utf8'))

      expect(typeof content).to.equal('object')
      expect(content.hasOwnProperty('snapshot')).to.equal(true)

      profiling.heapProfiling.destroy()
      resolve()
    }, 500)
  })
}
