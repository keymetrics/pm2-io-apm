
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
import { TracingConfig } from './features/tracing'
import { InspectorService } from './services/inspector'
import { canUseInspector } from './constants'
import { MetricConfig } from './features/metrics'
import { ProfilingConfig } from './features/profiling'

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
    gc: true,
    http: true
  },
  standalone: false,
  tracing: false
}

export default class PMX {

  private initialConfig: IOConfig
  private transport: Transport | null = null
  private featureManager: FeatureManager = new FeatureManager()
  private actionService: ActionService | null = null
  private metricService: MetricService | null = null
  private logger: Function = Debug('axm:main')
  private initialized: boolean = false

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
    if (config === undefined || config === null) {
      config = defaultConfig
    }

    // Register the transport before any other service
    const transportConfig: TransportConfig = config as TransportConfig
    this.transport = createTransport(config.standalone === true ? 'websocket' : 'ipc', transportConfig)
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
    const inspectorService: InspectorService | undefined = ServiceManager.get('inspector')
    if (inspectorService !== undefined && inspectorService !== null) {
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
  notifyError (error: Error, context?: ErrorContext) {
    const notify = this.featureManager.get('notify') as NotifyFeature
    return notify.notifyError(error, context)
  }

  /**
   * Register metrics in bulk
   */
  metrics (metric: MetricBulk | Array<MetricBulk>): any[] {

    const res: any[] = []
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
    if (callback && typeof callback === 'function') {
      const onExit = require('signal-exit')

      return onExit(callback)
    }
  }

  emit (name: string, data: any) {
    const events = this.featureManager.get('events') as EventsFeature
    return events.emit(name, data)
  }

  notify (error: Error) {
    const notify = this.featureManager.get('notify') as NotifyFeature
    return notify.notifyError(error)
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

    if (cb && typeof(cb) === 'function') return cb(null, opts)

    return opts
  }

  expressErrorHandler () {
    const notify = this.featureManager.get('notify') as NotifyFeature
    return notify.expressErrorHandler()
  }
}
