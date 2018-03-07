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
  notify.notify(new Error('info'), 'info')
  notify.notify(new Error('warn'), 'warn')
  notify.notify(new Error('error'), 'errors')
  notify.notify(new Error('does not exist'), 'does not exist')
}).catch(() => {
  console.log('error')
})
