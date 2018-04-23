import Metric from '../../../src/features/metrics'

const metric = new Metric()
metric.init({eventLoopDelay: true}, true)

process.on('SIGINT', function () {
  metric.destroy()
})
