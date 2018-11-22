
import * as merge from 'deepmerge'
import Configuration from './configuration'
import Debug from 'debug'
import * as fs from 'fs'
import { ServiceManager } from './serviceManager'
import Entrypoint from './features/entrypoint'
import { createTransport, TransportConfig } from './services/transport'
import { FeatureManager } from './featureManager'
import { Transport } from './services/transport'
import ActionService from './services/actions'
import { NotifyFeature, ErrorContext } from './features/notify'
import { Metric, MetricService, HistogramOptions, MetricBulk, MetricType, MetricMeasurements } from './services/metrics'
import Meter from './utils/metrics/meter'
import Histogram from './utils/metrics/histogram'
import Gauge from './utils/metrics/gauge'
import Counter from './utils/metrics/counter'
import { EventsFeature } from './features/events';
import {TracingConfig} from './features/tracing';

export class IOConfig {
  level?: string
  catchExceptions?: boolean
  metrics: any
  actions: any
  network: boolean
  ports?: boolean
  v8: boolean
  transactions: boolean
  http: boolean
  deep_metrics?: boolean // tslint:disable-line
  event_loop_dump?: boolean // tslint:disable-line
  profiling: boolean
  standalone: boolean
  publicKey?: string
  secretKey?: string
  appName?: string
  serverName?: string
  sendLogs?: Boolean
  tracing?: TracingConfig | boolean
}

export const defaultConfig: IOConfig = {
  catchExceptions: true,
  profiling: true,
  http: true,
  transactions: false,
  v8: true,
  network: false,
  actions: {},
  metrics: {},
  ports: false,
  standalone: false
}

export default class PMX {

  public Entrypoint: Entrypoint
  private initialConfig: IOConfig
  private transport: Transport | null
  private featureManager: FeatureManager = new FeatureManager()
  private actionService: ActionService | null
  private metricService: MetricService | null
  private logger: Function = Debug('axm:main')

  getInitialConfig (): IOConfig {
    return this.initialConfig
  }

  /**
   * Init the APM instance, you should *always* init it before using any method
   */
  init (config?: IOConfig, force?: boolean) {
    if (config === undefined || config === null) {
      config = defaultConfig
    }

    if (process.env.PMX_FORCE_UPDATE) {
      const IO_KEY = Symbol.for('@pm2/io')
      const globalSymbols = Object.getOwnPropertySymbols(global)
      if (globalSymbols.indexOf(IO_KEY) > -1) {
        global[IO_KEY].destroy()
      }

      global[IO_KEY] = this
    }

    // Register the transport before any other service
    const transportConfig: TransportConfig = config as TransportConfig
    this.transport = createTransport(config.standalone === true ? 'websocket' : 'ipc', transportConfig)
    ServiceManager.set('transport', this.transport)

    // register the action service
    this.actionService = new ActionService()
    ServiceManager.set('actions', this.actionService)

    // register the metric service
    this.metricService = new MetricService()
    ServiceManager.set('metrics', this.metricService)

    // Configuration
    config = this.backwardConfigConversion(config)

    // init features
    this.featureManager.init(config)

    Configuration.init(config)
    // save the configuration
    this.initialConfig = config

    return this
  }

  /**
   * Destroy the APM instance, every method will stop working afterwards
   */
  destroy () {
    this.featureManager.destroy()

    if (this.actionService !== null) {
      this.actionService.destroy()
    }
    if (this.transport !== null) {
      this.transport.destroy()
    }
  }

  /**
   * Notify an error to PM2 Plus/Enterprise, note that you can attach a context to it
   * to provide more insight about the error
   */
  notifyError (error: Error, context?: ErrorContext | string) {
    const notify = this.featureManager.get('notify') as NotifyFeature
    // before the level of error was top level
    if (typeof context === 'string') {
      context = { level: context }
    }
    return notify.notifyError(error, context)
  }

  /**
   * Register metrics in bulk
   */
  metrics (metric: MetricBulk | Array<MetricBulk>): Object {

    const res: Object = {}

    let metrics: Array<MetricBulk> = !Array.isArray(metric) ? [ metric ] : metric
    for (let metric of metrics) {
      if (typeof metric.name !== 'string') {
        console.trace(`Trying to create a metrics without a name`)
        continue
      }
      if (metric.type === undefined) {
        metric.type = MetricType.gauge
      }

      const key = metric.name.replace(/ /g, '_').replace(/[^\w\s]/gi, '')
      switch (metric.type) {
        case MetricType.counter : {
          res[key] = this.counter(metric)
          continue
        }
        case MetricType.gauge : {
          res[key] = this.gauge(metric)
          continue
        }
        case MetricType.histogram : {
          res[key] = this.histogram(metric as any)
          continue
        }
        case MetricType.meter : {
          res[key] = this.meter(metric)
          continue
        }
        case MetricType.metric : {
          res[key] = this.gauge(metric)
          continue
        }
      }
    }

    return res
  }

  /**
   * Create an histogram metric
   */
  histogram (config: HistogramOptions) : Histogram {
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
  metric (config: Metric) : Gauge {
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
  gauge (config: Metric) : Gauge {
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
  counter (config: Metric) : Counter {
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
  meter (config: Metric) : Meter {
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
    if (this.actionService === null) {
      // @ts-ignore
      // thanks mr typescript but it's in real specific case and want to have type completion
      return console.trace(`Tried to register a action without initializing @pm2/io`)
    }
    return this.actionService.registerAction(name, opts, fn)
  }

  /**
   * Register a scoped action
   * @deprecated we will remove scopedAction in the future
   */
  scopedAction (name: string, fn: Function) {
    if (this.actionService === null) {
      // @ts-ignore
      // thanks mr typescript but it's in real specific case and want to have type completion
      return console.trace(`Tried to register a action without initializing @pm2/io`)
    }
    return this.actionService.scopedAction(name, fn)
  }

  /**
   * We dropped support for this method (that was never used anyway)
   * @deprecated
   */
  transpose () {
    return console.error(`io.transpose has been removed from our APM`)
  }

  onExit (callback: Function) {
    if (callback && typeof callback === 'function') {
      const onExit = require('signal-exit')

      return onExit(callback)
    }
  }

  // -----------------------------------------------------------
  // Retro compatibility
  // -----------------------------------------------------------

  probe () {
    return {
      histogram: (options: HistogramOptions): Histogram => {
        if (this.metricService === null) {
          // @ts-ignore
          // thanks mr typescript but it's in real specific case and want to have type completion
          return console.trace(`Tried to register a metric without initializing @pm2/io`)
        }
        return this.histogram(options)
      },
      meter: (options: Metric): Meter => {
        if (this.metricService === null) {
          // @ts-ignore
          // thanks mr typescript but it's in real specific case and want to have type completion
          return console.trace(`Tried to register a metric without initializing @pm2/io`)
        }
        return this.meter(options)
      },
      metric: (options: Metric): Gauge => {
        if (this.metricService === null) {
          // @ts-ignore
          // thanks mr typescript but it's in real specific case and want to have type completion
          return console.trace(`Tried to register a metric without initializing @pm2/io`)
        }
        return this.gauge(options)
      },
      counter: (options: Metric): Counter => {
        if (this.metricService === null) {
          // @ts-ignore
          // thanks mr typescript but it's in real specific case and want to have type completion
          return console.trace(`Tried to register a metric without initializing @pm2/io`)
        }
        return this.counter(options)
      },
      transpose: () => {
        return console.error(`io.transpose has been removed from our APM`)
      }
    }
  }

  emit (name: string, data: any) {
    const events = this.featureManager.get('events') as EventsFeature
    return events.emit(name, data)
  }

  emitEvent (name: string, data: any) {
    const events = this.featureManager.get('events') as EventsFeature
    return events.emit(name, data)
  }

  notify (error: Error) {
    const notify = this.featureManager.get('notify') as NotifyFeature
    return notify.notifyError(error)
  }

  getPID (file: string) {
    if (typeof(file) === 'number') return file
    return parseInt(fs.readFileSync(file).toString(), 10)
  }

  initModule (opts: any, cb: Function) {
    if (!opts) opts = {}

    if (opts.reference) {
      opts.name = opts.reference
      delete opts.reference
    }

    opts = merge({
      widget: {}
    }, opts)

    opts.widget = merge({
      type : 'generic',
      logo : 'https://app.keymetrics.io/img/logo/keymetrics-300.png',
      theme            : ['#111111', '#1B2228', '#807C7C', '#807C7C']
    }, opts.widget)

    opts.isModule = true
    opts = Configuration.init(opts)

    if (cb && typeof(cb) === 'function') return cb(null, opts)

    return opts
  }

  expressErrorHandler () {
    const notify = this.featureManager.get('notify') as NotifyFeature
    return notify.expressErrorHandler()
  }

  private backwardConfigConversion (config: IOConfig): IOConfig {

    // handle old configuration for network metrics
    if (config.hasOwnProperty('network') || config.hasOwnProperty('ports')) {
      const networkConf: any = {}

      if (config.hasOwnProperty('network')) {
        networkConf.traffic = Boolean(config.network)
        delete config.network
      }

      if (config.hasOwnProperty('ports')) {
        networkConf.ports = Boolean(config.ports)
        delete config.ports
      }

      config.metrics.network = networkConf
    }

    // handle shortcut configuration for v8 metrics
    if (config.hasOwnProperty('v8')) {
      config.metrics.v8 = config.v8
      delete config.v8
    }

    // handle shortcut configuration for tracing feature
    if (config.hasOwnProperty('transactions')) {
      config.tracing = config.transactions
      delete config.transactions
    }

    // handle shortcut configuration for http metrics
    if (config.hasOwnProperty('http')) {
      config.metrics.transaction = {}
      config.metrics.transaction.http = config.http
      delete config.http
    }

    // handle shortcut configuration for deep_metrics metrics
    if (config.hasOwnProperty('deep_metrics')) {
      config.metrics.deepMetrics = config.deep_metrics
      delete config.deep_metrics
    }

    // handle shortcut configuration for event loop dump metrics
    if (config.hasOwnProperty('event_loop_dump')) {
      config.actions.eventLoopDump = config.event_loop_dump
      delete config.event_loop_dump
    }

    return config
  }
}
