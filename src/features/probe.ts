import { Feature } from './featureTypes'
import Meter from '../probes/meter'

export default class ProbeFeature implements Feature {
  init (): Object {
    return {
      metric: null,
      histogram: null,
      meter: this.meter,
      counter: null
    }
  }

  meter (opts: Object) {
    return new Meter(opts)
  }
}
