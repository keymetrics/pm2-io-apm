import pmx from '../../../src'
import * as v8 from 'v8'

v8.setFlagsFromString('--expose-gc')

pmx.init({
  metrics: {
    eventLoopActive: true,
    eventLoopDelay: true,
    v8: true
  },
  network: true
})

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {
  return
}, 5000)

process.on('SIGINT', function () {
  clearInterval(timer)
})
