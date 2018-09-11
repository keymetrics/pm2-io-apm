import ActionsFeature from '../../../src/features/actions'
import TransportService from '../../../src/services/transport'
import { ServiceManager } from '../../../src/serviceManager'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const actions = new ActionsFeature()
actions.initListener()

actions.init({profiling: {profilingCpu: true}}, true)
actions.action('myActionConf', {}, function (opts, reply) { reply({data: 'myActionConfReply', opts: opts}) })
