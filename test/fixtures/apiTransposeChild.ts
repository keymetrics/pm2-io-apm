import SpecUtils from './utils'

const io = require(__dirname + '/../../src/index.js')

io.init()

io.transpose('transpose', function () {
  return 'transposeResponse'
})

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {}, 5000)

process.on('SIGINT', function () {
  io.destroy()
  clearInterval(timer)
})
