import { Feature } from './featureTypes'
import Meter from '../metrics/meter'
import Counter from '../metrics/counter'

export default class MetricsFeature implements Feature {
  init (): Object {
    return {
      metric: null,
      histogram: null,
      meter: this.meter,
      counter: this.counter
    }
  }

  meter (opts: Object) {
    return new Meter(opts)
  }

  counter (opts?: Object) {
    return new Counter(opts)
  }
}
