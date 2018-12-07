import { fork } from 'child_process'
import { expect } from 'chai'
import 'mocha'

import { resolve } from 'path'

const launch = (fixture) => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: process.env.NYC_ROOT_ID ? process.execArgv : [ '-r', 'ts-node/register' ]
  })
}

describe('EventsFeature', function () {
  this.timeout(5000)
  describe('emit', () => {

    it('should emit an event', (done) => {
      const child = launch('../fixtures/features/eventsChild')
      child.on('message', res => {
        if (res.type === 'human:event') {
          child.kill('SIGKILL')
          expect(res.data.__name).to.equal('myEvent')
          expect(res.data.prop1).to.equal('value1')
          done()
        }
      })
    })
  })
})
