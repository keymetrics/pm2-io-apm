import Transport from '../../src/utils/transport'
import { expect } from 'chai'
import * as chai from 'chai'
import 'mocha'

describe('Transport', () => {
  let old

  before(() => {
    old = process.send
    delete process.send
  })

  after(() => {
    process.send = old
  })

  it('should not send cause no process.send function', () => {
    const transport = new Transport()
    const res = transport.send(new Error())

    expect(res).to.equal(-1)
  })
})
