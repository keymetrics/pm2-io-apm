'use strict'

import Meter from '../utils/metrics/meter'
import Counter from '../utils/metrics/counter'
import Histogram from '../utils/metrics/histogram'
import { ServiceManager } from '../serviceManager'
import constants from '../constants'
import {Transport} from './transport';
import * as Debug from 'debug'
import Gauge from '../utils/metrics/gauge';
import { Service } from '../serviceManager'

export enum MetricType {
  'meter',
  'histogram',
  'counter',
  'gauge',
  'metric' // deprecated, must use gauge
}

export enum MetricMeasurements {
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
}

export interface InternalMetric {
  /**
   * Display name of the metric, it should be a clear name that everyone can understand
   */
  name: string
  type: MetricType
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
  name: string
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
  private defaultAggregation: string = 'mean'
  private timer: NodeJS.Timer | null
  private transport: Transport | null
  private logger: any = Debug('axm:services:metrics')

  init (): void {
    this.transport = ServiceManager.get('transport')
    if (this.transport === null) return this.logger('Failed to init metrics service cause no transporter')

    this.timer = setInterval(() => {
      if (this.transport === null) return this.logger('Abort metrics update since transport is not available')
      for (let metric of this.metrics.values()) {
        metric.value = metric.handler()
      }
      // send all the metrics value to the transporter
      this.transport.setMetrics(Array.from(this.metrics.values()))
    }, constants.METRIC_INTERVAL)
    this.timer.unref()
  }


  registerMetric (metric: InternalMetric): void {
    if (typeof metric.name !== 'string') {
      return console.trace(`Invalid metric name declared: ${metric.name}`)
    } else if (typeof metric.type !== 'string') {
      return console.trace(`Invalid metric type declared: ${metric.type}`)
    } else if (typeof metric.handler !== 'function') {
      return console.trace(`Invalid metric handler declared: ${metric.handler}`)
    }
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
        return this.implementation.val()
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
        return this.implementation.val()
      }
    }
    this.registerMetric(metric)

    return metric.implementation
  }

  histogram (opts: HistogramOptions): Histogram {
    const metric: InternalMetric = {
      name: opts.name,
      type: MetricType.histogram,
      id: opts.id,
      historic: opts.historic,
      implementation: new Histogram(opts),
      unit: opts.unit,
      handler: function () {
        return (Math.round(this.histogram.val() * 100) / 100)
      }
    }
    this.registerMetric(metric)

    return metric.implementation
  }

  metric (opts: Metric): Gauge {
    const self = this
    const metric: InternalMetric = {
      name: opts.name,
      type: MetricType.gauge,
      id: opts.id,
      historic: opts.historic,
      implementation: new Gauge(),
      unit: opts.unit,
      handler: function () {
        return this.implementation.val()
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
