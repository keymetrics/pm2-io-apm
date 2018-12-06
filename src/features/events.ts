import { ServiceManager } from '../serviceManager'
import { Feature } from '../featureManager'
import { Transport } from '../services/transport'
import * as Debug from 'debug'

export class EventsFeature implements Feature {

  private transport: Transport | undefined
  private logger: Function = Debug('axm:features:events')

  init (): void {
    this.transport = ServiceManager.get('transport')
    this.logger('init')
  }

  emit (name: string, data: any) {
    if (typeof name !== 'string') {
      console.error('event name must be a string')
      return console.trace()
    }
    if (typeof data !== 'object') {
      console.error('event data must be an object')
      return console.trace()
    }

    let inflightObj: Object | any = {}
    try {
      inflightObj = JSON.parse(JSON.stringify(data))
    } catch (err) {
      return console.log('Failed to serialize the event data', err.message)
    }

    inflightObj.__name = name
    if (this.transport === undefined) {
      return this.logger('Failed to send event as transporter isnt available')
    }
    this.transport.send('human:event', inflightObj)
  }

  destroy () {
    this.logger('destroy')
  }
}
