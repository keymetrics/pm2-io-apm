import ActionsFeature from '../../../src/features/actions'

const actions = new ActionsFeature()

actions.init()
actions.action('myAction', {}, function (reply) { reply({data: 'testActionReply'}) })
actions.action('myActionNoOpts', function (reply) { reply({data: 'myActionNoOptsReply'}) })
