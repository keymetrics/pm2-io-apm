import SpecUtils from './fixtures/utils'
import { assert, expect } from 'chai'
import { exec, fork } from 'child_process'
import 'mocha'
const pmx = require(__dirname + '/../build/main/src/index.js')
const Entrypoint = pmx.Entrypoint

describe('Entrypoint', function () {
  this.timeout(20000)

  describe('Empty class', () => {
    it('should fail cause no onStart method', () => {
      try {
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

        if (res === 'terminated') {
          done()
        }
      })
    })
  })
})
