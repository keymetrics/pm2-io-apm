import V8Metric from '../../../src/metrics/v8'
import Metric from '../../../src/features/metrics'

const metric = new Metric()
metric.init({v8: 'all'}, true)

process.on('SIGINT', function () {
  metric.destroy()
})

setTimeout(function () {
  global.gc()
}, 1000)
