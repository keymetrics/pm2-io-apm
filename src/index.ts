import { NotifyFeature, NotifyOptions, NotifyOptionsDefault } from './features/notify'
import MetricsFeature from './features/metrics'
import ActionsFeature from './features/actions'
import EventFeature from './features/events'

class PMX {

  private notify: NotifyFeature
  private metricsFeature: MetricsFeature
  private actionsFeature: ActionsFeature
  private eventsFeature: EventFeature

  constructor () {
    this.notify = new NotifyFeature()
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

    if (config) {
      if (config.level) {
        notifyOptions = {
          level: config.level
        }
      }

      if (config.metrics) {
        configMetrics = config.metrics
      }
    }
    await this.notify.init(notifyOptions)
    this.metricsFeature.init(config.metrics)
  }

  notifyError (err: Error, context?) {
    let level = 'info'
    if (context && context.level) {
      level = context.level
    }

    this.notify.notifyError(err, level)
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
        return this.genericBackwardConvertion(histogram, 'histogram')
      },
      meter: (meter) => {
        return this.genericBackwardConvertion(meter, 'meter')
      },
      metric: (metric) => {
        return this.genericBackwardConvertion(metric, 'metric')
      },
      counter: (counter) => {
        return this.genericBackwardConvertion(counter, 'counter')
      }
    }
  }

  emit (name, data) {
    console.warn('Deprecated : this feature will be removed in next release !')

    this.eventsFeature.emit(name, data)
  }

  private genericBackwardConvertion (object, type) {
    if (typeof object !== 'object') {
      console.error('Parameter should be an object')
      return null
    }

    object.type = type

    return this.metric(object)[object.name]
  }
}

module.exports = new PMX()
