import V8Metric from '../../../src/metrics/v8'
import Metric from '../../../src/features/metrics'

const metric = new Metric()
metric.init({deepMetrics: 'all'})

const httpModule = require('http')
const httpsModule = require('https')

// test http outbound
httpModule.get('http://keymetrics.io')
// test https outbound
httpsModule.get('https://keymetrics.io')

process.on('SIGINT', function () {
  metric.destroy()
})
