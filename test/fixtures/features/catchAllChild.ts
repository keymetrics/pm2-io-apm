import { NotifyFeature } from '../../../src/features/notify'

const notify = new NotifyFeature()
notify.init().then(() => {
  notify.catchAll()

  throw new Error('test')
}).catch(() => {
  throw new Error('test')
})
