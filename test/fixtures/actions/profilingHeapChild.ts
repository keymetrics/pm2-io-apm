import Action from '../../../src/features/actions'
import ProfilingHeap from '../../../src/actions/profilingHeap'

const action = new Action()
action.init()

const profiling = new ProfilingHeap(action)
profiling.init()
