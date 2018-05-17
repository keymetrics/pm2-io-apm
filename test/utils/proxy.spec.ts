import Proxy from '../../src/utils/proxy'
import { expect } from 'chai'
import * as chai from 'chai'
import 'mocha'

describe('Proxy', () => {

  it('should return debug function in case method is not found', () => {
    const res = Proxy.wrap({}, ['toto'], {})
    expect(res).to.equal(undefined)
  })
})
