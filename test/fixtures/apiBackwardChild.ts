import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.init({
  profiling: false
})

const probe = pmx.probe()

const metric = probe.metric({
  name: 'metricBackward'
})

metric.set(10)

const counter = probe.counter({
  name: 'counterBackward'
})

counter.inc(2)

const histogram = probe.histogram({
  name: 'histogramBackward'
})

const meter = probe.meter({
  name: 'meterBackward'
})

process.on('SIGINT', function () {
  pmx.destroy()
})
