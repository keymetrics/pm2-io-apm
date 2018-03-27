import Module from '../../src/utils/module'

import { expect } from 'chai'
import 'mocha'

describe('Module', () => {

  it('should return false if module doesn\'t exist', () => {
    const module = Module.loadModule('./fake/path', 'test')
    expect(module).to.equal(undefined)
  })
})
