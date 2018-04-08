import { NotifyFeature } from '../../../src/features/notify'

const notify = new NotifyFeature()

notify.init().then(() => {
  notify.catchAll()
  const toto = 'yolo'
  throw new Error('test')
})
