import Action from '../../../src/features/actions'
import Inspector from '../../../src/actions/eventLoopInspector'

const action = new Action()
action.init()

const eventLoopInspector = new Inspector(action)
eventLoopInspector.eventLoopDump()
