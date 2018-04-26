import { NotifyFeature, NotifyOptions, NotifyOptionsDefault } from './features/notify'
import MetricsFeature from './features/metrics'
import ActionsFeature from './features/actions'
import EventFeature from './features/events'
import Inspector from './actions/eventLoopInspector'
import * as merge from 'deepmerge'
import Configuration from './configuration'

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

  async init (config?) {
    let notifyOptions: NotifyOptions = NotifyOptionsDefault
    let configMetrics = {}

    if (!config) {
      config = {}
    }

    if (config.level) {
      notifyOptions = {
        level: config.level
      }
    }

    if (config.metrics) {
      configMetrics = config.metrics
    }

    this.backwardConfigConversion(config)

    await this.notifyFeature.init(notifyOptions)
    this.metricsFeature.init(config.metrics)

    if (config.actions) {
      await this.actionsFeature.init(config.actions)
    }
  }

  destroy () {
    this.metricsFeature.destroy()
  }

  notifyError (err: Error, context?) {
    let level = 'info'
    if (context && context.level) {
      level = context.level
    }

    this.notifyFeature.notifyError(err, level)
  }

  metric (metrics: Object | Array<any>): Object {

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

      const type = currentMetric.type
      currentMetric.type = currentMetric.id
      delete currentMetric.id
      if (typeof this.metricsFeature[type] !== 'function') {
        console.warn(`Metric ${currentMetric.name} can't be initialized : unknown type ${type} !`)
        continue
      }

      res[currentMetric.name] = this.metricsFeature[type](currentMetric)
    }

    return res
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

      return onExit(callback())
    }
  }

  // -----------------------------------------------------------
  // Retro compatibility
  // -----------------------------------------------------------

  probe () {
    console.warn('Deprecated : you should use pmx instead of pmx.probe() !')

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
      }
    }
  }

  emit (name, data) {
    console.warn('Deprecated : this feature will be removed in next release !')

    this.eventsFeature.emit(name, data)
  }

  notify (notification) {
    console.warn('Deprecated : you should use pmx.notifyError() !')

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

    opts = new Configuration().init(opts)

    if (cb && typeof(cb) === 'function') return cb(null, opts)

    return opts
  }

  private genericBackwardConversion (object, type) {
    if (typeof object !== 'object') {
      console.error('Parameter should be an object')
      return null
    }

    object.type = type

    return this.metric(object)[object.name]
  }

  private backwardConfigConversion (config) {

    // ------------------------------------------
    // Network
    // ------------------------------------------
    if (config.hasOwnProperty('network') || config.hasOwnProperty('ports')) {
      const networkConf: any = {}

      if (config.hasOwnProperty('network')) {
        networkConf.traffic = config.network
        delete config.network
      }

      if (config.hasOwnProperty('ports')) {
        networkConf.ports = config.ports
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
        profilingCpu: true,
        profilingHeap: true
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

module.exports = new PMX()
