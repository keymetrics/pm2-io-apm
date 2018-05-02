import JsonUtils from '../../src/utils/json'
import { expect } from 'chai'
import * as chai from 'chai'
import 'mocha'

describe('Json', () => {

  it('should return the exact param cause it is not an object', () => {
    const res = JsonUtils.jsonize('test')
    expect(res).to.equal('test')
  })
})
