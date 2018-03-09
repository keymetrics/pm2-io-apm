import { Feature } from './featureTypes'
import Meter from '../metrics/meter'
import Counter from '../metrics/counter'
import Histogram from '../metrics/histogram'

export default class MetricsFeature implements Feature {
  init (): Object {
    return {
      metric: null,
      histogram: this.histogram,
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

  histogram (opts?: Object) {
    return new Histogram(opts)
  }
}
