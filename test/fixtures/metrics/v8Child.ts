import V8Metric from '../../../src/metrics/v8'
import Metric from '../../../src/features/metrics'

const metric = new Metric()
metric.init({v8: 'all'}, true)

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {}, 5000)

process.on('SIGINT', function () {
  clearInterval(timer)
  metric.destroy()
})

setTimeout(function () {
  global.gc()
}, 1000)
