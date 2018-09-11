import { NotifyFeature } from '../../../src/features/notify'
import TransportService from '../../../src/services/transport'
import { ServiceManager } from '../../../src/serviceManager'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const notify = new NotifyFeature()
notify.init()
notify.notifyError(new Error('test'))
