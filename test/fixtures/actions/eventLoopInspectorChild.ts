import Action from '../../../src/features/actions'
import Inspector from '../../../src/actions/eventLoopInspector'

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {}, 5000)

const action = new Action()
action.init({
  eventLoopDump: true
})

process.on('SIGINT', function () {
  action.destroy()
  clearInterval(timer)
})
