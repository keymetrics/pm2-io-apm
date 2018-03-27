import ActionsFeature from '../../../src/features/actions'

const actions = new ActionsFeature()

actions.init().then(() => {
  actions.scopedAction('myScopedAction', function (res) { res.send('myScopedActionReply') })
}).catch(() => {
  console.log('error')
})
