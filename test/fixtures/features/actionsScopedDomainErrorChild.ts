import ActionsFeature from '../../../src/features/actions'

const actions = new ActionsFeature()

actions.init({profilingCpu: false, profilingHeap: false})
actions.scopedAction('myScopedAction', function (res) { res.send('myScopedActionReply') })
