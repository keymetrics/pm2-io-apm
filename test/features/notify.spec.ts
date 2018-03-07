import { fork } from 'child_process'
import { expect, assert } from 'chai'
import 'mocha'

describe('Notify', () => {
  it('should send a notification', (done) => {
    const child = fork('./build/main/test/fixtures/features/notifyChild.js')
    child.on('message', msg => {
      expect(msg).to.equal('test')
      done()
    })
  })

  it('should send a notification for specific level', (done) => {
    const child = fork('./build/main/test/fixtures/features/notifyChildLevel.js')
    let count = 0
    child.on('message', msg => {
      count++

      if (msg === 'info') {
        assert.fail()
      } else {
        expect(msg === 'warn' || msg === 'error' || msg === 'does not exist').to.equal(true)
      }

      if (count === 3) {
        done()
      }
    })
  })
})
