import { NotifyFeature, NotifyOptions, NotifyOptionsDefault } from './features/notify'
import MetricsFeature from './features/metrics'
import ActionsFeature from './features/actions'
import EventFeature from './features/events'
import * as merge from 'deepmerge'
import Configuration from './configuration'
import Metriconfig from './utils/metricConfig'
import Debug from 'debug'
import * as fs from 'fs'
import * as cluster from 'cluster'
import { ServiceManager } from './serviceManager'
import Entrypoint from './features/entrypoint'
import TransportService from './services/transport'

const debug = Debug('PM2-IO-APM')

class TransactionConfig {
  tracing: boolean
  http: boolean
}

class MetricsConfig {
  transaction: TransactionConfig
  network: Object
  v8: boolean
  deepMetrics: boolean
}

class ActionsConfig {
  profilingCpu: boolean
  profilingHeap: boolean
  eventLoopDump: boolean
}

class IOConfig {
  level?: string
  catchExceptions?: boolean
  metrics: MetricsConfig
  actions: ActionsConfig
  network: boolean
  ports: boolean
  v8: boolean
  transactions: boolean
  http: boolean
  deep_metrics: boolean // tslint:disable-line
  event_loop_dump: boolean // tslint:disable-line
  profiling: boolean
  standalone: boolean
  publicKey?: string
  secretKey?: string
  appName?: string
  serverName?: string
  sendLogs?: Boolean
}

interface Context {
  level?: string
}

interface ActionOpts {
  name: string
  opts: Object
  action: Function
}

interface ConfigItem {
  type: string
  name: string
}

export default class PMX {

  private notifyFeature: NotifyFeature
  private metricsFeature: MetricsFeature
  private actionsFeature: ActionsFeature
  private eventsFeature: EventFeature
  public Entrypoint: Entrypoint
  private initialConfig: IOConfig

  constructor () {
    this.notifyFeature = new NotifyFeature()
    this.metricsFeature = new MetricsFeature()
    this.actionsFeature = new ActionsFeature(!cluster.isWorker)
    this.eventsFeature = new EventFeature()

    const eventLoopInspector = require('event-loop-inspector')(true)
    ServiceManager.set('eventLoopService', {
      inspector: eventLoopInspector
    })
    ServiceManager.set('transport', new TransportService())
  }

  getInitialConfig (): IOConfig {
    return this.initialConfig
  }

  init (config?: IOConfig, force?: boolean) {
    let notifyOptions: NotifyOptions = NotifyOptionsDefault
    let configMetrics = {}

    if (!config) {
      config = new IOConfig()
    }

    if (process.env.PMX_FORCE_UPDATE) {
      const IO_KEY = Symbol.for('@pm2/io')
      const globalSymbols = Object.getOwnPropertySymbols(global)
      const alreadyInstanciated = (globalSymbols.indexOf(IO_KEY) > -1)

      if (alreadyInstanciated) {
        global[IO_KEY].destroy()
      }

      global[IO_KEY] = this
    }

    if (config.level) {
      notifyOptions.level = config.level
    }
    if (config.catchExceptions) {
      notifyOptions.catchExceptions = config.catchExceptions
    }

    if (config.metrics) {
      configMetrics = config.metrics
    }

    (async _ => {
      // Transport
      if (config.standalone && config.publicKey && config.secretKey && config.appName) {
        ServiceManager.get('transport').initStandalone({
          publicKey: config.publicKey,
          secretKey: config.secretKey,
          appName: config.appName,
          serverName: config.serverName,
          sendLogs: config.sendLogs
        })
      } else {
        ServiceManager.get('transport').init()
      }

      // Configuration
      this.backwardConfigConversion(config)

      this.notifyFeature.init(notifyOptions)
      this.metricsFeature.init(config.metrics, force)
      this.actionsFeature.init(config.actions, force)
      this.actionsFeature.initListener()

      Configuration.init(config)
      this.initialConfig = config
    })()

    return this
  }

  destroy () {
    if (this.metricsFeature) this.metricsFeature.destroy()

    if (this.actionsFeature) this.actionsFeature.destroy()

    if (this.notifyFeature) this.notifyFeature.destroy()
  }

  notifyError (err: Error, context?: Context) {
    let level = 'info'
    if (context && context.level) {
      level = context.level
    }

    this.notifyFeature.notifyError(err, level)
  }

  metrics (metrics: Object | Array<Object>): Object {

    const res: Object = {}

    let allMetrics: Array<any> = []
    if (!Array.isArray(metrics)) {
      allMetrics[0] = metrics
    } else {
      allMetrics = metrics
    }

    for (let i = 0; i < allMetrics.length; i++) {
      const currentMetric = allMetrics[i]
      if (!currentMetric || !currentMetric.hasOwnProperty('name') || !currentMetric.hasOwnProperty('type')) {
        console.warn(`Metric can't be initialized : missing some properties !`)
        console.warn('name => required')
        console.warn('type => required')
        console.warn('id => optional')
        console.warn('unit => optional')
        console.warn('value => optional')
        console.warn('historic => optional')
        console.warn('agg_type => optional')
        console.warn('measurement => optional')
        continue
      }

      // escape spaces and special characters from metric's name
      const metricKey = currentMetric.name.replace(/ /g, '_').replace(/[^\w\s]/gi, '')

      const type = currentMetric.type
      currentMetric.type = currentMetric.id
      delete currentMetric.id
      if (typeof this.metricsFeature[type] !== 'function') {
        console.warn(`Metric ${currentMetric.name} cant be initialized : unknown type ${type} !`)
        continue
      }

      res[metricKey] = this.metricsFeature[type](currentMetric)
    }

    return res
  }

  histogram (config: Object) {
    config = Metriconfig.buildConfig(config)

    return this.metricsFeature['histogram'](config)
  }

  metric (config: Object) {
    config = Metriconfig.buildConfig(config)

    return this.metricsFeature['metric'](config)
  }

  counter (config: Object) {
    config = Metriconfig.buildConfig(config)

    return this.metricsFeature['counter'](config)
  }

  meter (config: Object) {
    config = Metriconfig.buildConfig(config)

    return this.metricsFeature['meter'](config)
  }

  action (name: string | ActionOpts, opts?: Object, fn?: Function) {
    if (typeof name === 'object') {
      opts = name.opts
      fn = name.action
      name = name.name
    }

    this.actionsFeature.action(name, opts, fn)
    // Only listen if transporter wasn't initiated (no pmx.init())
    if (!ServiceManager.get('transport').initiated) {
      this.actionsFeature.initListener()
    }
  }

  scopedAction (name: string, fn: Function) {
    this.actionsFeature.scopedAction(name, fn)
    // Only listen if transporter wasn't initiated (no pmx.init())
    if (!ServiceManager.get('transport').initiated) {
      this.actionsFeature.initListener()
    }
  }

  transpose (variableName: string, reporter: Function) {
    this.metricsFeature.transpose(variableName, reporter)
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
      histogram: (histogram) => {
        return this.genericBackwardConversion(histogram, 'histogram')
      },
      meter: (meter) => {
        return this.genericBackwardConversion(meter, 'meter')
      },
      metric: (metric) => {
        return this.genericBackwardConversion(metric, 'metric')
      },
      counter: (counter) => {
        return this.genericBackwardConversion(counter, 'counter')
      },
      transpose: (variableName, reporter) => {
        this.transpose(variableName, reporter)
      }
    }
  }

  emit (name: string, data: any) {
    this.eventsFeature.emit(name, data)
  }

  emitEvent (name: string, data: any) {
    this.eventsFeature.emit(name, data)
  }

  notify (notification: Error | any) {
    if (!(notification instanceof Error)) {
      notification = new Error(notification)
    }

    this.notifyFeature.notifyError(notification)
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
    return this.notifyFeature.expressErrorHandler()
  }

  private genericBackwardConversion (object: ConfigItem, type: string) {
    if (typeof object !== 'object') {
      console.error('Parameter should be an object')
      return null
    }

    object.type = type

    // escape spaces and special characters from metric's name
    const metricKey = object.name.replace(/ /g, '_').replace(/[^\w\s]/gi, '')
    return this.metrics(object)[metricKey]
  }

  private backwardConfigConversion (config: IOConfig) {

    // ------------------------------------------
    // Network
    // ------------------------------------------
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

      this.initMetricsConf(config)

      config.metrics.network = networkConf
    }

    // ------------------------------------------
    // V8
    // ------------------------------------------
    if (config.hasOwnProperty('v8')) {
      this.initMetricsConf(config)

      config.metrics.v8 = config.v8
      delete config.v8
    }

    // ------------------------------------------
    // transactions
    // ------------------------------------------
    if (config.hasOwnProperty('transactions') || config.hasOwnProperty('http')) {
      this.initMetricsConf(config)

      config.metrics.transaction = new TransactionConfig()

      if (config.hasOwnProperty('transactions')) {
        config.metrics.transaction.tracing = config.transactions
        delete config.transactions
      }

      if (config.hasOwnProperty('http')) {
        config.metrics.transaction.http = config.http
        delete config.http
      }
    }

    // ------------------------------------------
    // Deep metrics
    // ------------------------------------------
    if (config.hasOwnProperty('deep_metrics')) {
      this.initMetricsConf(config)

      config.metrics.deepMetrics = config.deep_metrics
      delete config.deep_metrics
    }

    // ------------------------------------------
    // Event Loop action
    // ------------------------------------------
    if (config.hasOwnProperty('event_loop_dump')) {
      this.initActionsConf(config)

      config.actions.eventLoopDump = config.event_loop_dump
      delete config.event_loop_dump
    }

    // ------------------------------------------
    // Profiling action
    // ------------------------------------------
    if (config.hasOwnProperty('profiling')) {
      this.initActionsConf(config)

      config.actions.profilingHeap = config.profiling
      config.actions.profilingHeap = config.profiling
      delete config.profiling
    }
  }

  private initMetricsConf (config: IOConfig) {
    if (!config.metrics) {
      config.metrics = new MetricsConfig()
    }
  }

  private initActionsConf (config: IOConfig) {
    if (!config.actions) {
      config.actions = new ActionsConfig()
    }
  }
}
