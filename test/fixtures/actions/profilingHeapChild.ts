import Action from '../../../src/features/actions'
import ProfilingHeap from '../../../src/actions/profilingHeap'
import TransportService from '../../../src/services/transport'
import { ServiceManager } from '../../../src/serviceManager'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const action = new Action()
action.initListener()

const profiling = new ProfilingHeap(action)
profiling.init().then(() => {
  if (process && process.send) {
    process.send('initialized')
  }
})

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {}, 5000)

process.on('SIGINT', function () {
  action.destroy()
  profiling.destroy()
  clearInterval(timer)
})
