import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.init()

pmx.transpose('transpose', function () {
  return 'transposeResponse'
})
