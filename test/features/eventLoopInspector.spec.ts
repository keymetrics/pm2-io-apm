
import { expect, assert } from 'chai'
import { fork, exec } from 'child_process'
import { resolve } from 'path'

const launch = (fixture) => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: process.env.NYC_ROOT_ID ? process.execArgv : [ '-r', 'ts-node/register' ]
  })
}

describe('EventLoopInspector', function () {
  this.timeout(20000)

  describe('Event loop inspector module', function () {

    it('should get event loop data', (done) => {
      const child = launch('../fixtures/features/eventLoopInspectorChild')

      child.on('message', res => {

        if (res.type === 'axm:action') {
          expect(res.data.action_type).to.equal('internal')
        }

        if (res.type === 'axm:reply') {

          expect(res.data.return.success).to.equal(true)
          expect(typeof res.data.return.dump).to.equal('object')
          child.kill('SIGINT')
        }
      })

      child.on('exit', function () {
        done()
      })

      const timer = setTimeout(function () {
        child.send('km:event-loop-dump')
      }, 2000)
    })
  })
})
