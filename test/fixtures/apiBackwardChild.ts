import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.init({
  profiling: false
})

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {}, 5000)

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
  clearInterval(timer)
  pmx.destroy()
})
