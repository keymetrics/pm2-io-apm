import ActionsFeature from '../../../src/features/actions'

const actions = new ActionsFeature()

actions.init().then(() => {
  actions.action('myAction', {}, function (reply) { reply({data: 'testActionReply'}) })
  actions.action('myActionNoOpts', function (reply) { reply({data: 'myActionNoOptsReply'}) })
}).catch(() => {
  console.log('error')
})
