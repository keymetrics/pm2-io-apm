import SpecUtils from './utils'

const io = require(__dirname + '/../../src/index.js')

io.init({ metrics:  { v8: true } })

// should not fail but display a warning
io.metrics()
io.metrics({})

const allMetrics = io.metrics(
  [
    {
      name: 'metricHistogram',
      type: 'histogram',
      id: 'metric/custom'
    },
    {
      name: 'metric with spaces',
      type: 'histogram',
      id: 'metric/custom'
    },
    {
      name: 'metric wi!th special chars % ///',
      type: 'histogram',
      id: 'metric/custom'
    },
    {
      name: 'metricFailure',
      type: 'notExist'
    }
  ]
)

allMetrics.metricHistogram.update(10)

// test inline declaration
const metric = io.metric('metricInline')
metric.set(11)

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {}, 5000)

process.on('SIGINT', function () {
  clearInterval(timer)
})
