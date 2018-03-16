import { Feature } from './featureTypes'
import Meter from '../utils/metrics/meter'
import Counter from '../utils/metrics/counter'
import Histogram from '../utils/metrics/histogram'
import { ServiceManager } from '../index'
import Transport from '../utils/transport'
import constants from '../constants'
import MetricsService from '../services/metrics'

export default class MetricsFeature implements Feature {
  private transport: Transport
  private _var: Map<string, any> = new Map()
  private defaultAggregation: string = 'avg'
  private _started: boolean = false
  private _alreadySentData: Array<string> = []
  private timer
  private metricService: MetricsService

  private AVAILABLE_MEASUREMENTS: Array<string> = [
    'min',
    'max',
    'sum',
    'count',
    'variance',
    'mean',
    'stddev',
    'median',
    'p75',
    'p95',
    'p99',
    'p999'
  ]

  constructor () {
    this.transport = ServiceManager.get('transport')
    this._var = ServiceManager.get('metricsMap')
    ServiceManager.set('metricService', new MetricsService(this))
    this.metricService = ServiceManager.get('metricService')
  }

  init (config?): any {
    if (this._started === false) {
      this._started = true
      const self = this

      this.timer = setInterval(function () {
        const data = self._cookData(self._getVar())

        // don't send empty data
        if (Object.keys(data).length !== 0) {
          self.transport.send({
            type: 'axm:monitor',
            data: data
          })
        }
      }, constants.METRIC_INTERVAL)
    }

    this.metricService.init(config)

    return {
      histogram: this.histogram,
      meter: this.meter,
      counter: this.counter,
      metric: this.metric
    }
  }

  meter (opts: any) {
    if (!opts.name) {
      return console.error('[Probe][Meter] Name not defined')
    }

    opts.unit = opts.unit || ''

    const meter = new Meter(opts)

    this._var.set(opts.name, {
      value: function () {
        return meter.val() + `${opts.unit}`
      },
      type    : opts.type || opts.name,
      historic: this._historicEnabled(opts.historic),
      agg_type: opts.agg_type || this.defaultAggregation,
      unit : opts.unit
    })

    return meter
  }

  counter (opts?: any) {
    if (!opts.name) {
      return console.error('[Probe][Counter] Name not defined')
    }

    const counter = new Counter(opts)

    this._var.set(opts.name, {
      value: function () { return counter.val() },
      type    : opts.type || opts.name,
      historic: this._historicEnabled(opts.historic),
      agg_type: opts.agg_type || this.defaultAggregation,
      unit : opts.unit
    })

    return counter
  }

  histogram (opts?: any) {
    if (!opts.name) {
      return console.error('[Probe][Histogram] Name not defined')
    }

    opts.measurement = opts.measurement || 'mean'
    opts.unit = opts.unit || ''

    if (this.AVAILABLE_MEASUREMENTS.indexOf(opts.measurement) === -1) {
      return console.error('[Probe][Histogram] Measure type %s does not exists', opts.measurement)
    }

    const histogram = new Histogram(opts)

    this._var.set(opts.name, {
      value: function () {
        return (Math.round(histogram.val() * 100) / 100) + `${opts.unit}`
      },
      type    : opts.type || opts.name,
      historic: this._historicEnabled(opts.historic),
      agg_type: opts.agg_type || this.defaultAggregation,
      unit : opts.unit
    })

    return histogram
  }

  metric (opts): any {
    if (!opts.name) {
      return console.error('[Probe][Metric] Name not defined')
    }

    this._var.set(opts.name, {
      value   : opts.value || 0,
      type    : opts.type || opts.name,
      historic: this._historicEnabled(opts.historic),
      agg_type: opts.agg_type || this.defaultAggregation,
      unit : opts.unit
    })

    const self = this

    return {
      val : function () {
        let value = self._var.get(opts.name).value

        if (typeof(value) === 'function') {
          value = value()
        }

        return value
      },
      set : function (dt) {
        self._var.get(opts.name).value = dt
      }
    }
  }

  deleteMetric (name: string) {
    this._var.delete(name)
    this._alreadySentData.splice(this._alreadySentData.indexOf(name), 1)
  }

  destroy () {
    clearInterval(this.timer)
    this._getVar().clear()
    this._started = false
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
  _getVar () {
    return this._var
  }

  /**
   * Data that will be sent to Keymetrics
   */
  _cookData (data) {
    const cookedData = {}
    const self = this

    data.forEach(function (probe, probeName) {

      if (typeof(data.get(probeName).value) === 'undefined') {
        return false
      }

      const value = self._getValue(data.get(probeName).value)

      // do not send data if this is always equal to 0
      // probably an initialized metric which is not "active"
      if ((self._alreadySentData.indexOf(probeName) === -1 && value !== 0) ||
        self._alreadySentData.indexOf(probeName) > -1) {
        if (self._alreadySentData.indexOf(probeName) === -1) {
          self._alreadySentData.push(probeName)
        }

        cookedData[probeName] = {
          value: value
        }

        /**
         * Attach aggregation mode
         */
        if (data.get(probeName).agg_type &&
          data.get(probeName).agg_type !== 'none') {
          cookedData[probeName].agg_type = data.get(probeName).agg_type
        }

        cookedData[probeName].historic = data.get(probeName).historic
        cookedData[probeName].type = data.get(probeName).type

        cookedData[probeName].unit = data.get(probeName).unit
      }
    })
    return cookedData
  }

  _getValue (value) {
    if (typeof(value) === 'function') {
      return value()
    }
    return value
  }
}
