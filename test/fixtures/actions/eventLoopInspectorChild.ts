import Action from '../../services/actions'
import Inspector from '../../features/eventLoopInspector'
import { ServiceManager } from '../../serviceManager'
import TransportService from '../../services/transport'

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
