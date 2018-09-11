import { NotifyFeature, NotifyOptions } from '../../../src/features/notify'
import TransportService from '../../../src/services/transport'
import { ServiceManager } from '../../../src/serviceManager'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const notify = new NotifyFeature()
class Option extends NotifyOptions {
  constructor (level: string) {
    super()
    this.level = level
  }
}
const option = new Option('warn')

notify.init(option)
notify.notifyError(new Error('info'), 'info')
notify.notifyError(new Error('warn'), 'warn')
notify.notifyError(new Error('error'), 'errors')
notify.notifyError(new Error('does not exist'), 'does not exist')
