import V8Metric from '../../../src/metrics/v8'
import Metric from '../../../src/features/metrics'

const metric = new Metric()
metric.init({deepMetrics: 'all'}, true)

const httpModule = require('http')
const httpsModule = require('https')

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {}, 5000)

// test http outbound
httpModule.get('http://keymetrics.io')
// test https outbound
httpsModule.get('https://keymetrics.io')

process.on('SIGINT', function () {
  clearInterval(timer)
  metric.destroy()
})
