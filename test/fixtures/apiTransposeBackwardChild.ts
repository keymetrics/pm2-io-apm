import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.init()

pmx.probe().transpose('transpose', function () {
  return 'transposeResponse'
})

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {}, 5000)

process.on('SIGINT', function () {
  clearInterval(timer)
})
