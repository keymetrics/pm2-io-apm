import Metric from '../../../src/features/metrics'

const metric = new Metric()
metric.init({ eventLoopActive: true } , true)

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {}, 5000)

process.on('SIGINT', function () {
  clearInterval(timer)
  metric.destroy()
})
