import debug from 'debug'
debug('axm:events')
import Transport from '../utils/transport.js'
import { ServiceManager } from '../serviceManager'

import * as stringify from 'json-stringify-safe'
import { Feature } from './featureTypes'

export default class Events implements Feature {
  private transport: Transport

  constructor () {
    this.transport = ServiceManager.get('transport')
  }

  async init (): Promise<Object> {
    return {
      emit: this.emit
    }
  }

  emit (name, data) {
    if (!name) {
      return debug('[AXM] emit.name is missing')
    }
    if (!data) {
      return debug('[AXM] emit.data is missing')
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
