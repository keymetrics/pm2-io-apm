import Action from '../../../src/features/actions'
import ProfilingCPU from '../../../src/actions/profilingCpu'

const action = new Action()
action.init()

const profiling = new ProfilingCPU(action)
profiling.init()

if (process && process.send) {
  process.send('initialized')
}
