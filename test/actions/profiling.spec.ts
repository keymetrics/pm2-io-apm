import SpecUtils from '../fixtures/utils'
import { expect } from 'chai'
import { fork, exec } from 'child_process'
import * as semver from 'semver'

const MODULE = semver.satisfies(process.version, '< 8.0.0') ? 'v8-profiler' : 'v8-profiler-node8'

describe('ProfilingAction', function () {
  this.timeout(50000)

  before(function (done) {
    exec('npm uninstall ' + MODULE, done)
  })

  after(function (done) {
    exec('npm uninstall ' + MODULE, done)
  })

  describe('CPU', () => {
    before(function (done) {
      if (semver.satisfies(process.version, '< 10.0.0')) {
        exec('npm install ' + MODULE, function (err) {
          expect(err).to.equal(null)
          setTimeout(done, 1000)
        })
      } else {
        done()
      }
    })

    it('should get cpu profile data', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/actions/profilingCPUChild.js'))
      let uuid

      child.on('message', res => {

        if (res.type === 'axm:action') {
          expect(res.data.action_type).to.equal('internal')
        }

        if (res.type === 'axm:reply') {
          expect(res.data.return.success).to.equal(true)
          if (res.data.action_name === 'km:cpu:profiling:start') {
            uuid = res.data.return.uuid
          }
        }
        if (res.type === 'profiling') {
          expect(typeof res.data.data).to.equal('string')

          expect(res.data.type).to.equal('cpuprofile')

          child.kill('SIGINT')
          done()
        }

        if (res === 'initialized') {
          child.send('km:cpu:profiling:start')

          setTimeout(function () {
            child.send('km:cpu:profiling:stop')
          }, 500)
        }
      })
    })

    it('should get cpu profile data with timeout', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/actions/profilingCPUChild.js'))
      let uuid

      child.on('message', res => {

        if (res.type === 'axm:action') {
          expect(res.data.action_type).to.equal('internal')
        }

        if (res.type === 'axm:reply') {
          if (res.data.action_name === 'km:cpu:profiling:start') {
            expect(res.data.return.success).to.equal(true)
            uuid = res.data.return.uuid
          }
        }
        if (res.type === 'profiling') {
          expect(typeof res.data.data).to.equal('string')

          expect(res.data.type).to.equal('cpuprofile')

          child.kill('SIGINT')
          done()
        }

        if (res === 'initialized') {
          child.send({
            msg: 'km:cpu:profiling:start',
            opts: { timeout: 500 }
          })
        }
      })
    })

    if (semver.satisfies(process.version, '8.x')) {
      it('should get cpu profile data (force inspector on node 8)', (done) => {
        const child = fork(SpecUtils.buildTestPath('fixtures/actions/profilingCPUForceInspectorChild.js'))
        let uuid

        child.on('message', res => {

          if (res.type === 'axm:action') {
            expect(res.data.action_type).to.equal('internal')
          }

          if (res.type === 'axm:reply') {
            expect(res.data.return.success).to.equal(true)
            if (res.data.action_name === 'km:cpu:profiling:start') {
              uuid = res.data.return.uuid
            }
          }
          if (res.type === 'profiling') {
            expect(typeof res.data.data).to.equal('string')
            expect(res.data.type).to.equal('cpuprofile')

            child.kill('SIGINT')
            done()
          }

          if (res === 'initialized') {
            child.send('km:cpu:profiling:start')

            setTimeout(function () {
              child.send('km:cpu:profiling:stop')
            }, 500)
          }
        })
      })
    }
  })

  describe('Heap', () => {
    before(function (done) {
      if (semver.satisfies(process.version, '< 10.0.0')) {
        exec('npm install ' + MODULE, function (err) {
          expect(err).to.equal(null)
          setTimeout(done, 1000)
        })
      } else {
        done()
      }
    })

    it('should get heap profile data', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/actions/profilingHeapChild.js'))
      let uuid

      child.on('message', res => {

        if (res.type === 'axm:action') {
          expect(res.data.action_type).to.equal('internal')
        }

        if (res.type === 'axm:reply') {
          expect(res.data.return.success).to.equal(true)
          if (res.data.action_name === 'km:heap:sampling:start') {
            uuid = res.data.return.uuid
          }
        }
        if (res.type === 'profiling') {
          expect(typeof res.data.data).to.equal('string')

          expect(res.data.type).to.equal('heapprofile')
          child.kill('SIGINT')
        }

        if (res === 'initialized') {
          setTimeout(function () {
            child.send('km:heap:sampling:start')
          }, 100)

          setTimeout(function () {
            child.send('km:heap:sampling:stop')
          }, 500)
        }
      })

      child.on('exit', function () {
        done()
      })
    })

    it('should get heap profile data with timeout', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/actions/profilingHeapChild.js'))
      let uuid

      child.on('message', res => {

        if (res.type === 'axm:action') {
          expect(res.data.action_type).to.equal('internal')
        }

        if (res.type === 'axm:reply') {
          expect(res.data.return.success).to.equal(true)

          if (res.data.action_name === 'km:heap:sampling:start') {
            uuid = res.data.return.uuid
          }
        }
        if (res.type === 'profiling') {
          expect(typeof res.data.data).to.equal('string')

          expect(res.data.type).to.equal('heapprofile')
          child.kill('SIGINT')
        }

        if (res === 'initialized') {
          setTimeout(function () {
            child.send({
              msg: 'km:heap:sampling:start',
              opts: { timeout: 500 }
            })
          }, 100)
        }
      })

      child.on('exit', function () {
        done()
      })
    })

    it('should get heap dump data', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/actions/profilingHeapChild.js'))

      child.on('message', res => {

        if (res.type === 'axm:action') {
          expect(res.data.action_type).to.equal('internal')
        }

        if (res.type === 'axm:reply') {

          expect(res.data.return.success).to.equal(true)
        }
        if (res.type === 'profiling') {
          expect(res.data.type).to.equal('heapdump')
          expect(typeof res.data.data).to.equal('string')

          child.kill('SIGINT')
        }

        if (res === 'initialized') {
          setTimeout(function () {
            child.send('km:heapdump')
          }, 500)
        }
      })

      child.on('exit', function () {
        done()
      })
    })
  })
})
