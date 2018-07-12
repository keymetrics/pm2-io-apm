import Action from '../../../src/features/actions'
import Inspector from '../../../src/actions/eventLoopInspector'

const action = new Action()
action.init()

const eventLoopInspector = new Inspector(action)
eventLoopInspector.init()

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {}, 5000)

process.on('SIGINT', function () {
  action.destroy()
  clearInterval(timer)
})
