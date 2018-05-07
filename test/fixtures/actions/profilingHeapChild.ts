import Action from '../../../src/features/actions'
import ProfilingHeap from '../../../src/actions/profilingHeap'

const action = new Action()

const profiling = new ProfilingHeap(action)
profiling.init().then(() => {
  if (process && process.send) {
    process.send('initialized')
  }
})
