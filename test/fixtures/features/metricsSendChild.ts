import Metric from '../../../src/features/metrics'
import constants from '../../../src/constants'
import Counter from '../../../src/utils/metrics/counter'

const metrics = new Metric()
metrics.init()
const counter = metrics.counter({name: 'testSend'})

if (counter instanceof Counter) {
  counter.inc()
}

process.on('SIGINT', function () {
  metrics.destroy()
})
