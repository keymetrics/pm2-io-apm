import Action from '../../services/actions'
import ProfilingHeap from '../../actions/profilingHeap'
import TransportService from '../../services/transport'
import { ServiceManager } from '../../serviceManager'

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
