import { Feature } from './featureTypes'
import Meter from '../metrics/meter'

export default class MetricsFeature implements Feature {
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
