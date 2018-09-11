import ActionsFeature from '../../../src/features/actions'
import TransportService from '../../../src/services/transport'
import { ServiceManager } from '../../../src/serviceManager'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const actions = new ActionsFeature()
actions.initListener()

actions.init({profilingCpu: false, profilingHeap: false})
actions.action('myAction', {}, function (reply) { reply({data: 'myActionReply'}) })
