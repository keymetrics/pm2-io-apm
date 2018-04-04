import { fork } from 'child_process'
import { expect, assert } from 'chai'
import 'mocha'
import SpecUtils from '../fixtures/utils'
import EventsFeature from '../../src/features/events'

describe('EventsFeature', () => {
  describe('emit', () => {

    it('should emit an event', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/features/eventsChild.js'))
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
      const child = fork(SpecUtils.buildTestPath('fixtures/features/eventsStringChild.js'))
      child.on('message', res => {
        if (res.type === 'human:event') {
          expect(res.data.__name).to.equal('myEvent')
          expect(res.data.data).to.equal('myValue')
          child.kill('SIGINT')
          done()
        }
      })
    })

    it('should not emit event (no name or no data)', () => {
      const events = new EventsFeature()

      events.init().then(() => {
        let res = events.emit(null, {})
        expect(res).to.equal(undefined)

        res = events.emit('myEvent', null)
        expect(res).to.equal(undefined)
      })
    })
  })
})
