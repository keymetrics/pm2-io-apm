import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.init()

const probe = pmx.probe()

const metric = probe.metric({
  name: 'metricBackward'
})

metric.set(10)
