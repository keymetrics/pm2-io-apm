import EventsFeature from '../../../src/features/events'

const events = new EventsFeature()

events.init().then(() => {
  events.emit('myEvent', {prop1: 'value1'})
}).catch(() => {
  console.log('error')
})
