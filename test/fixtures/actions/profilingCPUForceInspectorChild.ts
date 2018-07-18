process.env.FORCE_INSPECTOR = 'true'

import Action from '../../../src/features/actions'
import ProfilingCPU from '../../../src/actions/profilingCpu'

const action = new Action()

const profiling = new ProfilingCPU(action)
profiling.init().then(() => {
  if (process && process.send) {
    process.send('initialized')
  }
})
