import ActionsFeature from '../../services/actions'
import TransportService from '../../services/transport'
import { ServiceManager } from '../../serviceManager'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const actions = new ActionsFeature()
actions.initListener()

actions.init({profilingCpu: false, profilingHeap: false})
actions.scopedAction('myScopedAction', function (res) { res.send('myScopedActionReply') })
