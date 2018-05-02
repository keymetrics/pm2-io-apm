import JsonUtils from '../../src/utils/json'
import { expect } from 'chai'
import * as chai from 'chai'
import 'mocha'

describe('Json', () => {

  it('should not send cause no process.send function', () => {
    const res = JsonUtils.jsonize('test')
    expect(res).to.equal('test')
  })
})
