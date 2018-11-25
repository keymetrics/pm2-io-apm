
import io from '../../src'
import { MetricType } from '../../src/services/metrics'

// should not fail but display a warning
// @ts-ignore
io.metrics({})

const allMetrics = io.metrics(
  [
    {
      name: 'metricHistogram',
      type: MetricType.histogram,
      id: 'metric/custom'
    },
    {
      name: 'metric with spaces',
      type: MetricType.histogram,
      id: 'metric/custom'
    },
    {
      name: 'metric wi!th special chars % ///',
      type: MetricType.histogram,
      id: 'metric/custom'
    }
  ]
)

allMetrics.metricHistogram.update(10)

// test inline declaration
// @ts-ignore
const metric = io.metric('metricInline')
metric.set(11)

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {
  return
}, 5000)

process.on('SIGINT', function () {
  clearInterval(timer)
  io.destroy()
})
