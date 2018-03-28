import V8Metric from '../../../src/metrics/v8'
import Metric from '../../../src/features/metrics'

const metric = new Metric()
metric.init({v8: true}, true)

process.on('SIGINT', function () {
  metric.destroy()
})
