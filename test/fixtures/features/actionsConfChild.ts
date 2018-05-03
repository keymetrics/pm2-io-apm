import ActionsFeature from '../../../src/features/actions'

const actions = new ActionsFeature()

actions.init({profiling: {profilingCpu: true}}, true)
actions.action('myActionConf', {}, function (opts, reply) { reply({data: 'myActionConfReply', opts: opts}) })
