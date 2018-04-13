import debug from 'debug'
debug('axm:events')
import Transport from '../utils/transport.js'
import { ServiceManager } from '../serviceManager'

import * as stringify from 'json-stringify-safe'
import { Feature } from './featureTypes'

export default class Events implements Feature {
  private transport: Transport

  async init (): Promise<Object> {
    this.transport = ServiceManager.get('transport')

    return {
      emit: this.emit
    }
  }

  emit (name, data) {
    if (!name) {
      return console.error('[AXM] emit.name is missing')
    }
    if (!data) {
      return console.error('[AXM] emit.data is missing')
    }

    let inflightObj: Object | any = {}

    if (typeof(data) === 'object') {
      inflightObj = JSON.parse(stringify(data))
    } else {
      inflightObj.data = data
    }

    inflightObj.__name = name

    this.transport.send({
      type : 'human:event',
      data : inflightObj
    }, true)
    return false
  }
}
