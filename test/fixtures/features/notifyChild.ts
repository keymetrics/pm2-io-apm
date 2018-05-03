import { NotifyFeature } from '../../../src/features/notify'

const notify = new NotifyFeature()
notify.init()
notify.notifyError(new Error('test'))
