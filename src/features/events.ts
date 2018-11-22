import { ServiceManager } from '../serviceManager'
import * as stringify from 'json-stringify-safe'
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

  emit (name, data) {
    if (!name) {
      return console.error('[PMX] emit.name is missing')
    }
    if (!data) {
      return console.error('[PMX] emit.data is missing')
    }

    let inflightObj: Object | any = {}

    if (typeof(data) === 'object') {
      inflightObj = JSON.parse(stringify(data))
    } else {
      inflightObj.data = data
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
