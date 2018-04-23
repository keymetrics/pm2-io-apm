import SpecUtils from '../fixtures/utils'
import { expect } from 'chai'
import { fork, exec } from 'child_process'
import Action from '../../src/features/actions'

const MODULE = 'v8-profiler'

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
      exec('npm install ' + MODULE, function (err) {
        expect(err).to.equal(null)
        setTimeout(done, 1000)
      })
    })

    it('should get cpu profile data', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/actions/profilingCPUChild.js'))
      let uuid

      child.on('message', res => {

        if (res.type === 'axm:reply') {
          expect(res.data.return.success).to.equal(true)

          if (res.data.action_name === 'km:cpu:profiling:start') {
            uuid = res.data.return.uuid
          }

          if (res.data.action_name === 'km:cpu:profiling:stop') {
            expect(typeof res.data.return.dump_file).to.equal('string')
            expect(typeof res.data.return.dump_file_size).to.equal('number')

            expect(res.data.return.cpuprofile).to.equal(true)
            expect(res.data.return.uuid).to.equal(uuid)

            child.kill('SIGINT')
            done()
          }
        }
        if (res === 'initialized') {
          setTimeout(function () {
            child.send('km:cpu:profiling:start')
          }, 100)

          setTimeout(function () {
            child.send('km:cpu:profiling:stop')
          }, 500)
        }
      })
    })
  })

  describe('Heap', () => {
    before(function (done) {
      exec('npm install ' + MODULE, function (err) {
        expect(err).to.equal(null)
        setTimeout(done, 1000)
      })
    })

    it('should get heap profile data', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/actions/profilingHeapChild.js'))
      let uuid

      child.on('message', res => {

        if (res.type === 'axm:reply') {
          expect(res.data.return.success).to.equal(true)

          if (res.data.action_name === 'km:heap:sampling:start') {
            uuid = res.data.return.uuid
          }

          if (res.data.action_name === 'km:heap:sampling:stop') {
            expect(typeof res.data.return.dump_file).to.equal('string')
            expect(typeof res.data.return.dump_file_size).to.equal('number')

            expect(res.data.return.heapdump).to.equal(true)
            expect(res.data.return.uuid).to.equal(uuid)
            child.kill('SIGINT')
            done()
          }
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
    })

    it('should get heap dump data', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/actions/profilingHeapChild.js'))

      child.on('message', res => {

        if (res.type === 'axm:reply') {

          expect(res.data.return.success).to.equal(true)

          if (res.data.action_name === 'km:heapdump') {
            expect(res.data.return.heapdump).to.equal(true)
            expect(typeof res.data.return.dump_file).to.equal('string')

            child.kill('SIGINT')
            done()
          }
        }

        if (res === 'initialized') {
          setTimeout(function () {
            child.send('km:heapdump')
          }, 500)
        }
      })
    })
  })
})
