import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.init()

pmx.probe().transpose('transpose', function () {
  return 'transposeResponse'
})
