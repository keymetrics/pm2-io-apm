import { MetricService, MetricType } from '../services/metrics'
import { ServiceManager } from '../serviceManager'
import * as Debug from 'debug'
import { MetricInterface } from '../features/metrics'
import Histogram from '../utils/metrics/histogram'
import utils from '../utils/module'
import Gauge from '../utils/metrics/gauge'

export class GCMetricsOptions {
  gcType: boolean
  gcPause: boolean
}

const defaultOptions: GCMetricsOptions = {
  gcType: true,
  gcPause: true
}

export default class GCMetrics implements MetricInterface {

  private metricService: MetricService | undefined
  private logger: any = Debug('axm:features:metrics:gc')
  private gcHandler: Function
  private gcStatsInstance: any

  init (config?: GCMetricsOptions | boolean) {
    if (config === false) return
    if (config === undefined) {
      config = defaultOptions
    }
    if (config === true) {
      config = defaultOptions
    }

    this.metricService = ServiceManager.get('metrics')
    if (this.metricService === undefined) return this.logger('Failed to load metric service')

    this.logger('init')
    // try to find the module
    const modulePath = utils.detectModule('gc-stats')
    if (typeof modulePath !== 'string') return
    // if we find it we can try to require it
    const GCStats = utils.loadModule(modulePath)
    if (GCStats instanceof Error) {
      return this.logger(`Failed to require module gc-stats: ${GCStats.message}`)
    }
    this.gcStatsInstance = GCStats()

    const gcType = new Gauge()
    if (config.gcType === true) {
      this.metricService.registerMetric({
        name: 'GC Type',
        id: 'internal/v8/gc/type',
        type: MetricType.gauge,
        historic: false,
        implementation: gcType,
        handler: function () {
          return this.implementation.val()
        }
      })
    }

    const histogram = new Histogram()
    if (config.gcPause === true) {
      this.metricService.registerMetric({
        name: 'GC Mean Pause',
        id: 'internal/v8/gc/pause/p50',
        type: MetricType.histogram,
        historic: true,
        implementation: histogram,
        unit: 'ms',
        handler: function () {
          return this.implementation.val()
        }
      })
      this.metricService.registerMetric({
        name: 'GC P95 Pause',
        id: 'internal/v8/gc/pause/p95',
        type: MetricType.histogram,
        historic: true,
        implementation: histogram,
        unit: 'ms',
        handler: function () {
          return this.implementation.val()
        }
      })
    }

    this.gcHandler = (stats) => {
      // convert to milliseconds (cause pauseMs seems to use Math.floor)
      histogram.update(Math.round(stats.pause / 1000000))
      gcType.set(stats.gctype)
    }

    this.gcStatsInstance.on('stats', this.gcHandler)
  }

  destroy () {
    if (this.gcStatsInstance !== null) {
      this.gcStatsInstance.removeListener('stats', this.gcHandler)
    }
    this.logger('destroy')
  }
}
