import Module from '../../src/utils/module'

import { expect } from 'chai'
import 'mocha'

describe('Module', () => {

  it('should return an error if module doesn\'t exist', () => {
    const module = Module.loadModule('./fake/path', 'test')
    expect(module.message).to.equal('Cannot find module \'./fake/path\'')
  })
})
