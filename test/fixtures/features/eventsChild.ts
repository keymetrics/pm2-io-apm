import EventsFeature from '../../features/events'
import TransportService from '../../services/transport'
import { ServiceManager } from '../../serviceManager'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const events = new EventsFeature()

events.init().then(() => {
  events.emit('myEvent', {prop1: 'value1'})
}).catch(() => {
  console.log('error')
})
