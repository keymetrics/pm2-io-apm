process.env.FORCE_INSPECTOR = 'true'

import Action from '../../services/actions'
import ProfilingCPU from '../../actions/profilingCpu'
import TransportService from '../../services/transport'
import { ServiceManager } from '../../serviceManager'

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
