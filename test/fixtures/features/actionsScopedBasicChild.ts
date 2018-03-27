import ActionsFeature from '../../../src/features/actions'

const actions = new ActionsFeature()

actions.init().then(() => {
  actions.scopedAction('myScopedAction', function (opts, res) { res.send('myScopedActionReply') })
  actions.scopedAction('myScopedErrorAction', function (opts, res) { res.error('myScopedActionReplyError') })
  actions.scopedAction('myScopedEndAction', function (opts, res) { res.end('myScopedActionReplyEnd') })
}).catch(() => {
  console.log('error')
})
