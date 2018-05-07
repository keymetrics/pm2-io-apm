import ActionsFeature from '../../../src/features/actions'

const actions = new ActionsFeature()

actions.init({profilingCpu: false, profilingHeap: false})
actions.action('myAction', {}, function (opts, reply) { reply({data: 'myActionReply', opts: opts}) })
