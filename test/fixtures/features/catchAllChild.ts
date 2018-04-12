import { NotifyFeature } from '../../../src/features/notify'

const notify = new NotifyFeature()

notify.init().then(() => {
  const toto = 'yolo'
  throw new Error('test')
})
