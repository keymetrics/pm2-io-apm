import { NotifyFeature } from '../../../src/features/notify'

const notify = new NotifyFeature()
notify.init().then(() => {
  notify.notify(new Error('test'))
}).catch(() => {
  console.log('error')
})
