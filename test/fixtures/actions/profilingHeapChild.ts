import Action from '../../../src/features/actions'
import ProfilingHeap from '../../../src/actions/profilingHeap'

const action = new Action()

const profiling = new ProfilingHeap(action)
profiling.init().then(() => {
  if (process && process.send) {
    process.send('initialized')
  }
})

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {}, 5000)

process.on('SIGINT', function () {
  profiling.destroy()
  clearInterval(timer)
})
