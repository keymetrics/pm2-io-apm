import Transport from '../../src/utils/transport'
import SpecUtils from '../fixtures/utils'
import { expect } from 'chai'
import * as chai from 'chai'
import 'mocha'

import { fork } from 'child_process'

describe('Transport', () => {

  it('should not send cause no process.send function', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/utils/transportNoSendChild.js'))
    child.on('data', msg => {
      expect(msg).to.equal(-1)
      done()
    })
    child.on('exit', () => {
      done()
    })
  })

  it('should receive data', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/utils/transportChild.js'))

    child.on('message', msg => {
      expect(msg).to.equal('')
      done()
    })
  })
})
