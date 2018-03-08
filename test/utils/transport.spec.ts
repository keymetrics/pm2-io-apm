import Transport from '../../src/utils/transport'
import SpecUtils from '../fixtures/utils'
import { expect } from 'chai'
import * as chai from 'chai'
import 'mocha'

import { fork } from 'child_process'

describe('Transport', () => {

  it('should not send cause no process.send function', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/features/transportNoSendChild.js'))
    child.on('data', msg => {
      expect(msg).to.equal(-1)
      done()
    })
    child.on('exit', () => {
      done()
    })
  })

  it('should throw exception', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/features/transportChild.js'))

    child.on('exit', status => {
      expect(status).to.equal(1)
      done()
    })
  })
})
