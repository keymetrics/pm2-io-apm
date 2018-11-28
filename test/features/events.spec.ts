import { fork } from 'child_process'
import { expect } from 'chai'
import 'mocha'

import { resolve } from 'path'

const launch = (fixture) => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: [ '-r', 'ts-node/register' ]
  })
}

describe('EventsFeature', () => {
  describe('emit', () => {

    it('should emit an event', (done) => {
      const child = launch('../fixtures/features/eventsChild')
      child.on('message', res => {
        if (res.type === 'human:event') {
          expect(res.data.__name).to.equal('myEvent')
          expect(res.data.prop1).to.equal('value1')
          child.kill('SIGINT')
          done()
        }
      })
    })

    it('should emit an event with non object data', (done) => {
      const child = launch('../fixtures/features/eventsStringChild')
      child.on('message', res => {
        if (res.type === 'human:event') {
          expect(res.data.__name).to.equal('myEvent')
          expect(res.data.data).to.equal('myValue')
          child.kill('SIGINT')
          done()
        }
      })
    })
  })
})
