import Action from '../../../src/features/actions'
import ProfilingCPU from '../../../src/actions/profilingCpu'
import TransportService from '../../../src/services/transport'
import { ServiceManager } from '../../../src/serviceManager'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const action = new Action()
action.initListener()

const profiling = new ProfilingCPU(action)
profiling.init().then(() => {
  if (process && process.send) {
    process.send('initialized')
  }
})
