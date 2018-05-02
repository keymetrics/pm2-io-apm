import ActionsFeature from '../../../src/features/actions'

const actions = new ActionsFeature()

actions.init({profiling: {profilingCpu: true}}, true).then(() => {
  actions.action('myActionConf', {}, function (opts, reply) { reply({data: 'myActionConfReply', opts: opts}) })
}).catch(() => {
  console.log('error')
})
