import { Feature } from './featureTypes'
import Meter from '../metrics/meter'
import Counter from '../metrics/counter'
import Histogram from '../metrics/histogram'

export default class MetricsFeature implements Feature {
  private _var: Object = {}
  private defaultAggregation: string = 'avg'

  init (): Object {
    return {
      histogram: this.histogram,
      meter: this.meter,
      counter: this.counter,
      metric: this.metric,
      transpose: this.transpose
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

  /**
   * This reflect data to keymetrics
   * pmx.transpose('prop name', fn)
   *
   * or
   *
   * pmx.transpose({
   *   name : 'variable name',
   *   data : function() { return value }
   * });
   */
  transpose (variableName, reporter?) {
    if (typeof variableName === 'object') {
      reporter = variableName.data
      variableName = variableName.name
    }

    if (typeof reporter !== 'function') {
      return console.error('[PMX] reporter is not a function')
    }

    this._var[variableName] = {
      value: reporter
    }
  }

  metric (opts): any {
    if (!opts.name) {
      return console.error('[Probe][Metric] Name not defined')
    }

    this._var[opts.name] = {
      value   : opts.value || 0,
      type    : opts.type || opts.name,
      historic: this._historicEnabled(opts.historic),
      agg_type: opts.agg_type || this.defaultAggregation,
      unit : opts.unit
    }

    const self = this

    return {
      val : function () {
        let value = self._var[opts.name].value

        if (typeof(value) === 'function') {
          value = value()
        }

        return value
      },
      set : function (dt) {
        self._var[opts.name].value = dt
      }
    }
  }

  /** -----------------------------------------
   * Private Methods
   * ------------------------------------------
   */

  /**
   * Check if metric is historic or not
   *
   * @param historic
   * @returns {boolean}
   * @private
   */
  _historicEnabled (historic) {
    if (historic === false) {
      return false
    }
    if (typeof(historic) === 'undefined') {
      return true
    }
    return true
  }

  /**
   * Only for tests
   *
   * @returns {Object}
   */
  getVar () {
    return this._var
  }
}
