import ActionsFeature from '../../../src/features/actions'

const actions = new ActionsFeature()

actions.init().then(() => {
  actions.action('myAction', {}, function (reply) { reply({data: 'myActionReply'}) })
}).catch(() => {
  console.log('error')
})
