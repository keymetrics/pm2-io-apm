import SpecUtils from './fixtures/utils'
import { assert, expect } from 'chai'
import { exec, fork } from 'child_process'
import 'mocha'

describe('Entrypoint', function () {
  this.timeout(20000)

  describe('Empty class', () => {
    it('should fail cause no onStart method', () => {
      try {
        const pmx = require(__dirname + '/../build/main/src/index.js')
        const Entrypoint = pmx.Entrypoint
        const entrypoint = new Entrypoint()
      } catch (e) {
        expect(e.message).to.equal('Entrypoint onStart() not specified')
      }
    })
  })

  describe('Basic class', () => {
    it('should instantiate a basic entrypoint', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/entrypointChild.js'))

      child.on('message', res => {

        if (res.type && res.type === 'axm:option:configuration' && res.data && res.data.metrics) {
          expect(res.data.metrics.eventLoopActive).to.equal(false)
        }

        if (res === 'ready') {
          child.kill('SIGINT')
        }
      })

      let exited = 0

      child.on('exit', (err, code) => {
        if (!exited) {
          exited = 1
          expect(err).to.equal(null)
          expect(code).to.equal('SIGINT')
          done()
        }
      })
    })
  })
})
