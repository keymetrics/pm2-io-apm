import EventsFeature from '../../../src/features/events'

const events = new EventsFeature()

events.init().then(() => {
  events.emit('myEvent', 'myValue')
}).catch(() => {
  console.log('error')
})
