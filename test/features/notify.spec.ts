import { fork } from 'child_process'
import { expect } from 'chai'
import 'mocha'

describe('Notify', () => {
  it('should send a notification', (done) => {
    const child = fork('./build/main/test/fixtures/features/notifyChild.js')
    child.on('message', msg => {
      expect(msg).to.equal('test')
      done()
    })
  })
})
