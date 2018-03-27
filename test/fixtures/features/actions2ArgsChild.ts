import ActionsFeature from '../../../src/features/actions'

const actions = new ActionsFeature()

actions.init().then(() => {
  actions.action('myAction', {}, function (opts, reply) { reply({data: 'myActionReply', opts: opts}) })
}).catch(() => {
  console.log('error')
})
