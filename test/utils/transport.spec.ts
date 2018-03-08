import Transport from '../../src/utils/transport'
import { expect } from 'chai'
import * as chai from 'chai'
import 'mocha'

import { fork } from 'child_process'

describe('Transport', () => {

  it('should not send cause no process.send function', () => {

    const transport = new Transport()
    const res = transport.send(new Error())

    expect(res).to.equal(-1)
  })

  it('should throw exception', (done) => {
    const child = fork('./build/main/test/fixtures/features/transportChild.js')

    child.on('exit', status => {
      expect(status).to.equal(1)
      done()
    })
  })
})
