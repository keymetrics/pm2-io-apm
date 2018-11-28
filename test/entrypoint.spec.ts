
import { expect } from 'chai'
import pmx from '../src'
import { fork } from 'child_process'
import { resolve } from 'path'

const launch = (fixture) => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: [ '-r', 'ts-node/register' ]
  })
}

describe('Entrypoint', function () {
  this.timeout(20000)

  describe('Empty class', () => {
    it('should fail cause no onStart method', () => {
      try {
        const entrypoint = new pmx.Entrypoint()
      } catch (e) {
        expect(e.message).to.equal('Entrypoint onStart() not specified')
      }
    })
  })

  describe('Basic class', () => {
    it('should instantiate a basic entrypoint', (done) => {
      const child = launch('fixtures/entrypointChild')

      child.on('message', res => {

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
