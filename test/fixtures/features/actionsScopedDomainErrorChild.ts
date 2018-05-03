import ActionsFeature from '../../../src/features/actions'

const actions = new ActionsFeature()

actions.init()
actions.scopedAction('myScopedAction', function (res) { res.send('myScopedActionReply') })
