'use strict'

import * as shimmer from 'shimmer'
import Debug from 'debug'
import Configuration from '../configuration'
import { MetricInterface } from '../features/metrics'
import { ServiceManager } from '../serviceManager'
import Meter from '../utils/metrics/meter'
import Histogram from '../utils/metrics/histogram'
import * as requireMiddle from 'require-in-the-middle'

import {
  MetricService,
  InternalMetric,
  MetricType,
  Metric
} from '../services/metrics'

export class HttpMetricsConfig {
  http: boolean
}

export default class HttpMetrics implements MetricInterface {

  private defaultConf: HttpMetricsConfig = {
    http: true
  }
  private metrics: Map<string, any> = new Map<string, any>()
  private logger: any = Debug('axm:features:metrics:http')
  private metricService: MetricService | undefined
  private modules: any = {}
  private hooks

  init (config?: HttpMetricsConfig | boolean) {
    if (config === false) return
    if (config === undefined) {
      config = this.defaultConf
    }
    if (typeof config !== 'object') {
      config = this.defaultConf
    }
    this.logger('init')
    Configuration.configureModule({
      latency: true
    })
    this.metricService = ServiceManager.get('metrics')
    if (this.metricService === undefined) return this.logger(`Failed to load metric service`)

    this.logger('hooking to require')
    this.hookRequire()
  }

  private registerHttpMetric () {
    if (this.metricService === undefined) return this.logger(`Failed to load metric service`)
    const histogram = new Histogram()
    const p50: InternalMetric = {
      name: `HTTP Mean Latency`,
      id: 'internal/http/builtin/latency/p50',
      type: MetricType.histogram,
      historic: true,
      implementation: histogram,
      unit: 'ms',
      handler: () => {
        const percentiles = histogram.percentiles([ 0.5 ])
        return percentiles[0.5]
      }
    }
    const p95: InternalMetric = {
      name: `HTTP P95 Latency`,
      id: 'internal/http/builtin/latency/p95',
      type: MetricType.histogram,
      historic: true,
      implementation: histogram,
      handler: () => {
        const percentiles = histogram.percentiles([ 0.95 ])
        return percentiles[0.95]
      },
      unit: 'ms'
    }
    const meter: Metric = {
      name: 'HTTP',
      historic: true,
      id: 'internal/http/builtin/reqs',
      unit: 'req/min'
    }
    this.metricService.registerMetric(p50)
    this.metricService.registerMetric(p95)
    this.metrics.set('http.latency', histogram)
    this.metrics.set('http.meter', this.metricService.meter(meter))
  }

  private registerHttpsMetric () {
    if (this.metricService === undefined) return this.logger(`Failed to load metric service`)
    const histogram = new Histogram()
    const p50: InternalMetric = {
      name: `HTTPS Mean Latency`,
      id: 'internal/https/builtin/latency/p50',
      type: MetricType.histogram,
      historic: true,
      implementation: histogram,
      unit: 'ms',
      handler: () => {
        const percentiles = histogram.percentiles([ 0.5 ])
        return percentiles[0.5]
      }
    }
    const p95: InternalMetric = {
      name: `HTTPS P95 Latency`,
      id: 'internal/https/builtin/latency/p95',
      type: MetricType.histogram,
      historic: true,
      implementation: histogram,
      handler: () => {
        const percentiles = histogram.percentiles([ 0.95 ])
        return percentiles[0.95]
      },
      unit: 'ms'
    }
    const meter: Metric = {
      name: 'HTTPS',
      historic: true,
      id: 'internal/https/builtin/reqs',
      unit: 'req/min'
    }
    this.metricService.registerMetric(p50)
    this.metricService.registerMetric(p95)
    this.metrics.set('https.latency', histogram)
    this.metrics.set('https.meter', this.metricService.meter(meter))
  }

  destroy () {
    if (this.modules.http !== undefined) {
      this.logger('unwraping http module')
      shimmer.unwrap(this.modules.http, 'emit')
      this.modules.http = undefined
    }
    if (this.modules.https !== undefined) {
      this.logger('unwraping https module')
      shimmer.unwrap(this.modules.https, 'emit')
      this.modules.https = undefined
    }
    if (this.hooks) {
      this.hooks.unhook()
    }
    this.logger('destroy')
  }

  /**
   * Hook the http emit event emitter to be able to track response latency / request count
   */
  private hookHttp (nodule: any, name: string) {
    if (nodule.Server === undefined || nodule.Server.prototype === undefined) return
    if (this.modules[name] !== undefined) return this.logger(`Module ${name} already hooked`)
    this.logger(`Hooking to ${name} module`)
    this.modules[name] = nodule.Server.prototype
    // register the metrics
    if (name === 'http') {
      this.registerHttpMetric()
    } else if (name === 'https') {
      this.registerHttpsMetric()
    }
    const self = this
    // wrap the emitter
    shimmer.wrap(nodule.Server.prototype, 'emit', (original: Function) => {
      return function (event: string, req: any, res: any) {
        // only handle http request
        if (event !== 'request') return original.apply(this, arguments)

        const meter: Meter | undefined = self.metrics.get(`${name}.meter`)
        if (meter !== undefined) {
          meter.mark()
        }
        const latency: Histogram | undefined = self.metrics.get(`${name}.latency`)
        if (latency === undefined) return original.apply(this, arguments)
        if (res === undefined || res === null) return original.apply(this, arguments)
        const startTime = Date.now()
        // wait for the response to set the metrics
        res.once('finish', _ => {
          latency.update(Date.now() - startTime)
        })
        return original.apply(this, arguments)
      }
    })
  }

  private hookRequire () {
    this.hooks = requireMiddle(['http', 'https'], (exports, name) => {
      this.hookHttp(exports, name)
      return exports
    })
  }
}
