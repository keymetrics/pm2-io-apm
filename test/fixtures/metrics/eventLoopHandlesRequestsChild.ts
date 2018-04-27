import Metric from '../../../src/features/metrics'

const metric = new Metric()
metric.init({eventLoopActive: true}, true)

process.on('SIGINT', function () {
  metric.destroy()
})
