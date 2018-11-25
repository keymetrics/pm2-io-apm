
import pmx from '../../src'

pmx.init({
  profiling: false
})

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {
  return
}, 5000)

const probe = pmx.probe()

const metric = probe.metric({
  name: 'metricBackward'
})

metric.set(10)

const counter = probe.counter({
  name: 'counterBackward'
})

counter.inc(2)

// @ts-ignore
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
