import Metric from '../../../src/features/metrics'

const metric = new Metric()
metric.init()

process.on('SIGINT', function () {
  metric.destroy()
})
