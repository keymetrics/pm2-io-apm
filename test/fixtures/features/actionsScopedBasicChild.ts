import ActionsFeature from '../../services/actions'
import TransportService from '../../services/transport'
import { ServiceManager } from '../../serviceManager'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const actions = new ActionsFeature()
actions.initListener()

actions.init({profilingCpu: false, profilingHeap: false})

actions.scopedAction('myScopedAction', function (opts, res) { res.send('myScopedActionReply') })
actions.scopedAction('myScopedErrorAction', function (opts, res) { res.error('myScopedActionReplyError') })
actions.scopedAction('myScopedEndAction', function (opts, res) { res.end('myScopedActionReplyEnd') })
