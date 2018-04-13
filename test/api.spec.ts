import SpecUtils from './fixtures/utils'
import { expect } from 'chai'
import * as chai from 'chai'
import 'mocha'

import { fork } from 'child_process'

describe('API', () => {

  describe('Notify', () => {
    it('should receive data', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/apiChild.js'))

      child.on('message', msg => {
        expect(msg).to.equal('myNotify')
        child.kill('SIGINT')
        done()
      })
    })
  })
})
