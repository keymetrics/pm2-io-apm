import { NotifyFeature } from '../../features/notify'
import TransportService from '../../services/transport'
import { ServiceManager } from '../../serviceManager'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const notify = new NotifyFeature()

notify.init()
const toto = 'yolo'
throw new Error('test')
