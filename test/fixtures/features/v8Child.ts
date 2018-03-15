import V8Metric from '../../../src/metrics/v8'
import Metric from '../../../src/features/metrics'

const metric = new Metric()
metric.init()
const v8 = new V8Metric(metric)

process.on('SIGINT', function () {
  v8.destroy()
  metric.destroy()
})

