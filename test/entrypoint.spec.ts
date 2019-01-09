
import { assert, expect } from 'chai'
import { exec, fork } from 'child_process'
import { resolve } from 'path'
import * as pmx from '../src'

const launch = (fixture) => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: process.env.NYC_ROOT_ID ? process.execArgv : [ '-r', 'ts-node/register' ]
  })
}

describe('Entrypoint', function () {
  this.timeout(20000)

  describe('Empty class', () => {
    it('should fail cause no onStart method', () => {
      try {
        const entrypoint = new pmx.Entrypoint()
      } catch (err) {
        expect(err.message).to.equal('Entrypoint onStart() not specified')
      }
    })
  })

  describe('Basic class', () => {
    it('should instantiate a basic entrypoint', (done) => {
      const child = launch('fixtures/entrypointChild')
      let hasConfig = false

      child.on('message', res => {

        if (res.type && res.type === 'axm:option:configuration' && res.data && res.data.metrics && res.data.metrics.eventLoop === false) {
          hasConfig = true
        }

        if (res === 'ready') {
          assert(hasConfig === true, 'should have both the good config and is ready sent')
          child.kill('SIGINT')
        }
      })

      let exited = 0

      child.on('exit', (code, signal) => {
        if (!exited) {
          exited = 1
          expect(code).to.equal(null)
          expect(signal).to.equal('SIGINT')
          done()
        }
      })
    })
  })
})
