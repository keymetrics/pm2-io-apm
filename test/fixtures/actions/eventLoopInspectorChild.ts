import Action from '../../../src/features/actions'
import Inspector from '../../../src/actions/eventLoopInspector'
import { ServiceManager } from '../../../src/serviceManager'
import TransportService from '../../../src/services/transport'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const eventLoopInspector = require('event-loop-inspector')(true)
ServiceManager.set('eventLoopService', {
  inspector: eventLoopInspector
})

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {}, 5000)

const action = new Action()
action.initListener()
action.init({
  eventLoopDump: true
})

process.on('SIGINT', function () {
  action.destroy()
  clearInterval(timer)
})
