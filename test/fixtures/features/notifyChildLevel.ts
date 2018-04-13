import { NotifyFeature, NotifyOptions } from '../../../src/features/notify'

const notify = new NotifyFeature()
class Option extends NotifyOptions {
  constructor (level: string) {
    super()
    this.level = level
  }
}
const option = new Option('warn')

notify.init(option).then(() => {
  notify.notifyError(new Error('info'), 'info')
  notify.notifyError(new Error('warn'), 'warn')
  notify.notifyError(new Error('error'), 'errors')
  notify.notifyError(new Error('does not exist'), 'does not exist')
}).catch(() => {
  console.log('error')
})
