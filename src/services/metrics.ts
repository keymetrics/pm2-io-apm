'use strict'

import Meter from '../utils/metrics/meter'
import Counter from '../utils/metrics/counter'
import Histogram from '../utils/metrics/histogram'
import { ServiceManager, Service } from '../serviceManager'
import constants from '../constants'
import { Transport } from './transport'
import * as Debug from 'debug'
import Gauge from '../utils/metrics/gauge'

export enum MetricType {
  'meter' = 'meter',
  'histogram' = 'histogram',
  'counter' = 'counter',
  'gauge' = 'gauge',
  'metric' = 'metric' // deprecated, must use gauge
}

export enum MetricMeasurements {
  'min' = 'min',
  'max' = 'max',
  'sum' = 'sum',
  'count' = 'count',
  'variance' = 'variance',
  'mean' = 'mean',
  'stddev' = 'stddev',
  'median' = 'median',
  'p75' = 'p75',
  'p95' = 'p95',
  'p99' = 'p99',
  'p999' = 'p999'
}

export interface InternalMetric {
  /**
   * Display name of the metric, it should be a clear name that everyone can understand
   */
  name?: string
  type?: MetricType
  /**
   * An precise identifier for your metric, exemple:
   * The heap usage can be shown to user as 'Heap Usage' but internally
   * we want to put few namespace to be sure we talking about the main heap of v8
   * so we would choose something like: process/v8/heap/usage
   */
  id?: string
  /**
   * Choose if the metrics will be saved in our datastore or only be used in realtime
   */
  historic?: boolean
  /**
   * Unit of the metric
   */
  unit?: string
  /**
   * The handler is the function that will be called to get the current value
   * of the metrics
   */
  handler: Function
  /**
   * The implementation is the instance of the class that handle the computation
   * of the metric value
   */
  implementation: any
  /**
   * Last known value of the metric
   */
  value?: number
}

export class Metric {
  /**
   * Display name of the metric, it should be a clear name that everyone can understand
   */
  name?: string
  /**
   * An precise identifier for your metric, exemple:
   * The heap usage can be shown to user as 'Heap Usage' but internally
   * we want to put few namespace to be sure we talking about the main heap of v8
   * so we would choose something like: process/v8/heap/usage
   */
  id?: string
  /**
   * Choose if the metrics will be saved in our datastore or only be used in realtime
   */
  historic?: boolean
  /**
   * Unit of the metric
   */
  unit?: string
}

export class MetricBulk extends Metric {
  type: MetricType
}

export class HistogramOptions extends Metric {
  measurement: MetricMeasurements
}

export class MetricService implements Service {

  private metrics: Map<string, InternalMetric> = new Map()
  private timer: NodeJS.Timer | null = null
  private transport: Transport | null = null
  private logger: any = Debug('axm:services:metrics')

  init (): void {
    this.transport = ServiceManager.get('transport')
    if (this.transport === null) return this.logger('Failed to init metrics service cause no transporter')

    this.logger('init')
    this.timer = setInterval(() => {
      if (this.transport === null) return this.logger('Abort metrics update since transport is not available')
      this.logger('refreshing metrics value')
      for (let metric of this.metrics.values()) {
        metric.value = metric.handler()
      }
      this.logger('sending update metrics value to transporter')
      // send all the metrics value to the transporter
      const metricsToSend = Array.from(this.metrics.values())
        .filter(metric => {
          // thanks tslint but user can be dumb sometimes
          /* tslint:disable */
          if (metric === null || metric === undefined) return false
          if (metric.value === undefined || metric.value === null) return false

          const isNumber = typeof metric.value === 'number'
          const isString = typeof metric.value === 'string'
          const isValidNumber = !isNaN(metric.value)
          /* tslint:enable */
          // we send it only if it's a string or a valid number
          return isString || (isNumber && isValidNumber)
        })
      this.transport.setMetrics(metricsToSend)
    }, constants.METRIC_INTERVAL)
    this.timer.unref()
  }

  registerMetric (metric: InternalMetric): void {
    // thanks tslint but user can be dumb sometimes
    /* tslint:disable */
    if (typeof metric.name !== 'string') {
      console.error(`Invalid metric name declared: ${metric.name}`)
      return console.trace()
    } else if (typeof metric.type !== 'string') {
      console.error(`Invalid metric type declared: ${metric.type}`)
      return console.trace()
    } else if (typeof metric.handler !== 'function') {
      console.error(`Invalid metric handler declared: ${metric.handler}`)
      return console.trace()
    }
    /* tslint:enable */
    if (typeof metric.historic !== 'boolean') {
      metric.historic = true
    }
    this.logger(`Registering new metric: ${metric.name}`)
    this.metrics.set(metric.name, metric)
  }

  meter (opts: Metric): Meter {
    const metric: InternalMetric = {
      name: opts.name,
      type: MetricType.meter,
      id: opts.id,
      historic: opts.historic,
      implementation: new Meter(opts),
      unit: opts.unit,
      handler: function () {
        return this.implementation.isUsed() ? this.implementation.val() : NaN
      }
    }
    this.registerMetric(metric)

    return metric.implementation
  }

  counter (opts: Metric): Counter {
    const metric: InternalMetric = {
      name: opts.name,
      type: MetricType.counter,
      id: opts.id,
      historic: opts.historic,
      implementation: new Counter(opts),
      unit: opts.unit,
      handler: function () {
        return this.implementation.isUsed() ? this.implementation.val() : NaN
      }
    }
    this.registerMetric(metric)

    return metric.implementation
  }

  histogram (opts: HistogramOptions): Histogram {
    // tslint:disable-next-line
    if (opts.measurement === undefined || opts.measurement === null) {
      opts.measurement = MetricMeasurements.mean
    }
    const metric: InternalMetric = {
      name: opts.name,
      type: MetricType.histogram,
      id: opts.id,
      historic: opts.historic,
      implementation: new Histogram(opts),
      unit: opts.unit,
      handler: function () {
        return this.implementation.isUsed() ?
          (Math.round(this.implementation.val() * 100) / 100) : NaN
      }
    }
    this.registerMetric(metric)

    return metric.implementation
  }

  metric (opts: Metric): Gauge {
    // @ts-ignore warn of backward compatbility
    if (typeof opts.value === 'function') {
      console.error(`We dropped the support for setting the value of a metrics with a function, see new docs`)
      console.trace()
    }
    const metric: InternalMetric = {
      name: opts.name,
      type: MetricType.gauge,
      id: opts.id,
      historic: opts.historic,
      implementation: new Gauge(),
      unit: opts.unit,
      handler: function () {
        return this.implementation.isUsed() ? this.implementation.val() : NaN
      }
    }
    this.registerMetric(metric)

    return metric.implementation
  }

  deleteMetric (name: string) {
    return this.metrics.delete(name)
  }

  destroy () {
    if (this.timer !== null) {
      clearInterval(this.timer)
    }
    this.metrics.clear()
  }
}
