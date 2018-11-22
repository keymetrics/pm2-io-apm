import Metric from '../../services/metrics'
import constants from '../../constants'
import Counter from '../../utils/metrics/counter'
import TransportService from '../../services/transport'
import { ServiceManager } from '../../serviceManager'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const metrics = new Metric()
metrics.init()

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {}, 5000)

const counter = metrics.counter({name: 'testSend'})

if (counter instanceof Counter) {
  counter.inc()
}

process.on('SIGINT', function () {
  clearInterval(timer)
  metrics.destroy()
})
