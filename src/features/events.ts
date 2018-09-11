import { ServiceManager } from '../serviceManager'
import * as stringify from 'json-stringify-safe'
import { Feature } from './featureTypes'

export default class Events implements Feature {

  async init (): Promise<Object> {
    return {
      emit: this.emit
    }
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

    ServiceManager.get('transport').send('human:event', inflightObj)
    return false
  }
}
