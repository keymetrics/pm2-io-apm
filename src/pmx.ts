'use strict'

import Configuration from './configuration'
import Debug from 'debug'
import { ServiceManager } from './serviceManager'
import { createTransport, TransportConfig, Transport } from './services/transport'
import { FeatureManager } from './featureManager'
import { ActionService } from './services/actions'
import { NotifyFeature, ErrorContext } from './features/notify'
import { Metric, MetricService, HistogramOptions, MetricBulk, MetricType, MetricMeasurements } from './services/metrics'
import Meter from './utils/metrics/meter'
import Histogram from './utils/metrics/histogram'
import Gauge from './utils/metrics/gauge'
import Counter from './utils/metrics/counter'
import { EventsFeature } from './features/events'
import { TracingConfig, TracingFeature } from './features/tracing'
import { InspectorService } from './services/inspector'
import { canUseInspector } from './constants'
import { MetricConfig } from './features/metrics'
import { ProfilingConfig } from './features/profiling'
import { RuntimeStatsService } from './services/runtimeStats'
import { Entrypoint } from './features/entrypoint'
import { TracerBase } from '@opencensus/core'

export class IOConfig {
  /**
   * Automatically catch unhandled errors
   */
  catchExceptions?: boolean = true
  /**
   * Configure the metrics to add automatically to your process
   */
  metrics?: MetricConfig
  /**
   * Configure the default actions that you can run
   */
  actions?: {
    eventLoopDump?: boolean
  }
  /**
   * Configure availables profilers that will be exposed
   */
  profiling?: ProfilingConfig | boolean = true
  /**
   * Configure the transaction tracing options
   */
  tracing?: TracingConfig | boolean = false
  /**
   * If you want to connect to PM2 Enterprise without using PM2, you should enable
   * the standalone mode
   */
  standalone?: boolean = false
  /**
   * Define custom options for the standalone mode
   */
  apmOptions?: TransportConfig
}

export const defaultConfig: IOConfig = {
  catchExceptions: true,
  profiling: true,
  metrics: {
    v8: true,
    network: false,
    eventLoop: true,
    runtime: true,
    http: true
  },
  standalone: false,
  apmOptions: undefined,
  tracing: {
    enabled: false,
    outbound: false
  }
}

export default class PMX {

  private initialConfig: IOConfig
  private featureManager: FeatureManager = new FeatureManager()
  private transport: Transport | null = null
  private actionService: ActionService | null = null
  private metricService: MetricService | null = null
  private runtimeStatsService: RuntimeStatsService | null = null
  private logger: Function = Debug('axm:main')
  private initialized: boolean = false
  public Entrypoint: { new(): Entrypoint } = Entrypoint

  /**
   * Init the APM instance, you should *always* init it before using any method
   */
  init (config?: IOConfig) {
    const callsite = (new Error().stack || '').split('\n')[2]
    if (callsite && callsite.length > 0) {
      this.logger(`init from ${callsite}`)
    }

    if (this.initialized === true) {
      this.logger(`Calling init but was already the case, destroying and recreating`)
      this.destroy()
    }
    if (config === undefined) {
      config = defaultConfig
    }
    if (!config.standalone) {
      const autoStandalone = process.env.PM2_SECRET_KEY && process.env.PM2_PUBLIC_KEY && process.env.PM2_APP_NAME
      config.standalone = !!autoStandalone
      config.apmOptions = autoStandalone ? {
        secretKey: process.env.PM2_SECRET_KEY,
        publicKey: process.env.PM2_PUBLIC_KEY,
        appName: process.env.PM2_APP_NAME
      } as TransportConfig : undefined
    }

    // Register the transport before any other service
    this.transport = createTransport(config.standalone === true ? 'websocket' : 'ipc', config.apmOptions as TransportConfig)
    ServiceManager.set('transport', this.transport)

    if (canUseInspector()) {
      const Inspector = require('./services/inspector')
      const inspectorService = new Inspector()
      inspectorService.init()
      ServiceManager.set('inspector', inspectorService)
    }

    // register the action service
    this.actionService = new ActionService()
    this.actionService.init()
    ServiceManager.set('actions', this.actionService)

    // register the metric service
    this.metricService = new MetricService()
    this.metricService.init()
    ServiceManager.set('metrics', this.metricService)

    this.runtimeStatsService = new RuntimeStatsService()
    this.runtimeStatsService.init()
    if (this.runtimeStatsService.isEnabled()) {
      ServiceManager.set('runtimeStats', this.runtimeStatsService)
    }

    // init features
    this.featureManager.init(config)

    Configuration.init(config)
    // save the configuration
    this.initialConfig = config
    this.initialized = true

    return this
  }

  /**
   * Destroy the APM instance, every method will stop working afterwards
   */
  destroy () {
    this.logger('destroy')
    this.featureManager.destroy()

    if (this.actionService !== null) {
      this.actionService.destroy()
    }
    if (this.transport !== null) {
      this.transport.destroy()
    }
    if (this.metricService !== null) {
      this.metricService.destroy()
    }
    if (this.runtimeStatsService !== null) {
      this.runtimeStatsService.destroy()
    }
    const inspectorService: InspectorService | undefined = ServiceManager.get('inspector')
    if (inspectorService !== undefined) {
      inspectorService.destroy()
    }
  }

  /**
   * Fetch current configuration of the APM
   */
  getConfig (): IOConfig {
    return this.initialConfig
  }

  /**
   * Notify an error to PM2 Plus/Enterprise, note that you can attach a context to it
   * to provide more insight about the error
   */
  notifyError (error: Error | string | {}, context?: ErrorContext) {
    const notify = this.featureManager.get('notify') as NotifyFeature
    return notify.notifyError(error, context)
  }

  /**
   * Register metrics in bulk
   */
  metrics (metric: MetricBulk | Array<MetricBulk>): any[] {

    const res: any[] = []
    // tslint:disable-next-line
    if (metric === undefined || metric === null) {
      console.error(`Received empty metric to create`)
      console.trace()
      return []
    }

    let metrics: Array<MetricBulk> = !Array.isArray(metric) ? [ metric ] : metric
    for (let metric of metrics) {
      if (typeof metric.name !== 'string') {
        console.error(`Trying to create a metrics without a name`, metric)
        console.trace()
        res.push({})
        continue
      }
      // tslint:disable-next-line
      if (metric.type === undefined) {
        metric.type = MetricType.gauge
      }
      switch (metric.type) {
        case MetricType.counter : {
          res.push(this.counter(metric))
          continue
        }
        case MetricType.gauge : {
          res.push(this.gauge(metric))
          continue
        }
        case MetricType.histogram : {
          res.push(this.histogram(metric as any))
          continue
        }
        case MetricType.meter : {
          res.push(this.meter(metric))
          continue
        }
        case MetricType.metric : {
          res.push(this.gauge(metric))
          continue
        }
        default: {
          console.error(`Invalid metric type ${metric.type} for metric ${metric.name}`)
          console.trace()
          res.push({})
          continue
        }
      }
    }

    return res
  }

  /**
   * Create an histogram metric
   */
  histogram (config: HistogramOptions): Histogram {
    // tslint:disable-next-line
    if (typeof config === 'string') {
      config = {
        name: config as string,
        measurement: MetricMeasurements.mean
      }
    }
    if (this.metricService === null) {
      // @ts-ignore
      // thanks mr typescript but it's in real specific case and want to have type completion
      return console.trace(`Tried to register a metric without initializing @pm2/io`)
    }

    return this.metricService.histogram(config)
  }

  /**
   * Create a gauge metric
   */
  metric (config: Metric): Gauge {
    // tslint:disable-next-line
    if (typeof config === 'string') {
      config = {
        name: config as string
      }
    }
    if (this.metricService === null) {
      // @ts-ignore
      // thanks mr typescript but it's in real specific case and want to have type completion
      return console.trace(`Tried to register a metric without initializing @pm2/io`)
    }
    return this.metricService.metric(config)
  }

  /**
   * Create a gauge metric
   */
  gauge (config: Metric): Gauge {
    // tslint:disable-next-line
    if (typeof config === 'string') {
      config = {
        name: config as string
      }
    }
    if (this.metricService === null) {
      // @ts-ignore
      // thanks mr typescript but it's in real specific case and want to have type completion
      return console.trace(`Tried to register a metric without initializing @pm2/io`)
    }
    return this.metricService.metric(config)
  }

  /**
   * Create a counter metric
   */
  counter (config: Metric): Counter {
    // tslint:disable-next-line
    if (typeof config === 'string') {
      config = {
        name: config as string
      }
    }
    if (this.metricService === null) {
      // @ts-ignore
      // thanks mr typescript but it's in real specific case and want to have type completion
      return console.trace(`Tried to register a metric without initializing @pm2/io`)
    }

    return this.metricService.counter(config)
  }

  /**
   * Create a meter metric
   */
  meter (config: Metric): Meter {
    // tslint:disable-next-line
    if (typeof config === 'string') {
      config = {
        name: config as string
      }
    }
    if (this.metricService === null) {
      // @ts-ignore
      // thanks mr typescript but it's in real specific case and want to have type completion
      return console.trace(`Tried to register a metric without initializing @pm2/io`)
    }

    return this.metricService.meter(config)
  }

  /**
   * Register a custom action that will be executed when the someone called
   * it from the API
   */
  action (name: string, opts?: Object, fn?: Function) {
    // backward compatiblity
    // tslint:disable-next-line
    if (typeof name === 'object') {
      const tmp: any = name
      name = tmp.name
      opts = tmp.options
      fn = tmp.action
    }
    if (this.actionService === null) {
      // @ts-ignore
      // thanks mr typescript but it's in real specific case and want to have type completion
      return console.trace(`Tried to register a action without initializing @pm2/io`)
    }
    return this.actionService.registerAction(name, opts, fn)
  }

  onExit (callback: Function) {
    // tslint:disable-next-line
    if (typeof callback === 'function') {
      const onExit = require('signal-exit')

      return onExit(callback)
    }
  }

  /**
   * Emit a custom event to Keymetrics
   * @deprecated
   *
   * The feature has been removed from PM2 Plus and will be removed in future release
   */
  emit (name: string, data: Object) {
    const events = this.featureManager.get('events') as EventsFeature
    return events.emit(name, data)
  }

  /**
   * Get the tracing agent to add more information about traces
   */
  getTracer (): TracerBase | undefined {
    const tracing = this.featureManager.get('tracing') as TracingFeature
    return tracing.getTracer()
  }

  initModule (opts: any, cb?: Function) {
    if (!opts) opts = {}

    if (opts.reference) {
      opts.name = opts.reference
      delete opts.reference
    }

    opts = Object.assign({
      widget: {}
    }, opts)

    opts.widget = Object.assign({
      type : 'generic',
      logo : 'https://app.keymetrics.io/img/logo/keymetrics-300.png',
      theme            : ['#111111', '#1B2228', '#807C7C', '#807C7C']
    }, opts.widget)

    opts.isModule = true
    opts = Configuration.init(opts)

    return typeof cb === 'function' ? cb(null, opts) : opts
  }

  /**
   * Return a custom express middleware that will send an error to the backend
   * with all the details of the http request
   */
  expressErrorHandler () {
    const notify = this.featureManager.get('notify') as NotifyFeature
    return notify.expressErrorHandler()
  }

  /**
   * Return a custom koa middleware that will send an error to the backend
   * with all the details of the http request
   */
  koaErrorHandler () {
    const notify = this.featureManager.get('notify') as NotifyFeature
    return notify.koaErrorHandler()
  }
}
