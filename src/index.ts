import { NotifyFeature, NotifyOptions, NotifyOptionsDefault } from './features/notify'
import MetricsFeature from './features/metrics'
import ActionsFeature from './features/actions'
import EventFeature from './features/events'
import Inspector from './actions/eventLoopInspector'
import * as merge from 'deepmerge'
import Configuration from './configuration'
import Metriconfig from './utils/metricConfig'
import Debug from 'debug'
const debug = Debug('PM2-IO-APM')

class PMX {

  private notifyFeature: NotifyFeature
  private metricsFeature: MetricsFeature
  private actionsFeature: ActionsFeature
  private eventsFeature: EventFeature

  constructor () {
    this.notifyFeature = new NotifyFeature()
    this.metricsFeature = new MetricsFeature()
    this.actionsFeature = new ActionsFeature()
    this.eventsFeature = new EventFeature()
  }

  init (config?) {
    let notifyOptions: NotifyOptions = NotifyOptionsDefault
    let configMetrics = {}

    if (!config) {
      config = {}
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

    this.backwardConfigConversion(config)

    this.notifyFeature.init(notifyOptions)
    this.metricsFeature.init(config.metrics)

    this.actionsFeature.init(config.actions)

    Configuration.init(config)
    return this
  }

  destroy () {
    if (this.metricsFeature) this.metricsFeature.destroy()

    if (this.actionsFeature) this.actionsFeature.destroy()
  }

  notifyError (err: Error, context?) {
    let level = 'info'
    if (context && context.level) {
      level = context.level
    }

    this.notifyFeature.notifyError(err, level)
  }

  metrics (metrics: Object | Array<any>): Object {

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

  histogram (config) {
    config = Metriconfig.buildConfig(config)

    return this.metricsFeature['histogram'](config)
  }

  metric (config) {
    config = Metriconfig.buildConfig(config)

    return this.metricsFeature['metric'](config)
  }

  counter (config) {
    config = Metriconfig.buildConfig(config)

    return this.metricsFeature['counter'](config)
  }

  meter (config) {
    config = Metriconfig.buildConfig(config)

    return this.metricsFeature['meter'](config)
  }

  action (name, opts?, fn?) {
    if (typeof name === 'object') {
      opts = name.opts
      fn = name.action
      name = name.name
    }

    this.actionsFeature.action(name, opts, fn)
  }

  scopedAction (name, fn) {
    this.actionsFeature.scopedAction(name, fn)
  }

  transpose (variableName, reporter) {
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
    console.warn('Deprecated : you should use io instead of io.probe() !')

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

  emit (name, data) {
    console.warn('Deprecated : emit() method will be removed in next major release !')

    this.eventsFeature.emit(name, data)
  }

  notify (notification) {
    console.warn('Deprecated : you should use io.notifyError() !')

    if (!(notification instanceof Error)) {
      notification = new Error(notification)
    }

    this.notifyFeature.notifyError(notification)
  }

  initModule (opts, cb) {
    if (!opts) opts = {}

    opts = merge({
      alert_enabled    : true,
      widget           : {}
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

  private genericBackwardConversion (object, type) {
    if (typeof object !== 'object') {
      console.error('Parameter should be an object')
      return null
    }

    object.type = type

    // escape spaces and special characters from metric's name
    const metricKey = object.name.replace(/ /g, '_').replace(/[^\w\s]/gi, '')
    return this.metrics(object)[metricKey]
  }

  private backwardConfigConversion (config) {

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

      config.metrics.transaction = {}

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

      config.actions = {
        profilingCpu: config.profiling,
        profilingHeap: config.profiling
      }
      delete config.profiling
    }
  }

  private initMetricsConf (config) {
    if (!config.metrics) {
      config.metrics = {}
    }
  }

  private initActionsConf (config) {
    if (!config.actions) {
      config.actions = {}
    }
  }
}

// -----------------------------------
// create a unique, global symbol name
// -----------------------------------

const IO_KEY = Symbol.for('@pm2/io')

// ------------------------------------------
// check if the global object has this symbol
// add it if it does not have the symbol, yet
// ------------------------------------------

const globalSymbols = Object.getOwnPropertySymbols(global)
const hasKey = (globalSymbols.indexOf(IO_KEY) > -1)

if (!hasKey) {
  global[IO_KEY] = new PMX()
}

class Entrypoint {

  public defaultConf = {
    metrics: {
      eventLoopActive: true,
      eventLoopDelay: true,

      network: {
        traffic: false,
        ports: false
      },

      transaction: {
        http: true,
        tracing: false
      },

      deepMetrics: false,

      v8: false
    },

    actions: {
      eventLoopDump: false,
      profilingCpu: true,
      profilingHeap: true
    }
  }

  private io: PMX

  constructor () {
    try {
      this.io = global[IO_KEY].init(this.conf())

      this.onStart(err => {

        if (err) {
          debug(err)
        }

        this.metrics()
        this.actions()

        this.io.onExit((code, signal) => {
          this.onStop(err, () => {
            this.io.destroy()
          }, code, signal)
        })

        if (process && process.send) process.send('ready')
      })
    } catch (e) {
      // properly exit in case onStart/onStop method has not been override
      if (this.io) {
        this.io.destroy()
      }

      throw (e)
    }
  }

  metrics () {
    debug('No metrics !')
  }

  actions () {
    debug('No actions !')
  }

  onStart (cb: Function) {
    throw new Error('Entrypoint onStart() not specified')
  }

  onStop (err: Error, cb: Function, code: number, signal: string) {
    cb() // by default only execute callback
  }

  conf () {
    return this.defaultConf
  }
}

if (!hasKey) {
  global[IO_KEY].Entrypoint = Entrypoint

  // Freeze API, cannot be modified
  Object.freeze(global[IO_KEY])
}

module.exports = global[IO_KEY]
