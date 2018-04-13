import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.init({metrics:  {v8: true}})

// should not fail but display a warning
pmx.metric()
pmx.metric({})

const allMetrics = pmx.metric(
  [
    {
      name: 'metricHistogram',
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
