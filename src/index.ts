import { NotifyFeature, NotifyOptions, NotifyOptionsDefault } from './features/notify'
import MetricsFeature from './features/metrics'
import ActionsFeature from './features/actions'

class PMX {

  private notify: NotifyFeature
  private metricsFeature: MetricsFeature
  private actionsFeature: ActionsFeature

  constructor () {
    this.notify = new NotifyFeature()
    this.metricsFeature = new MetricsFeature()
    this.actionsFeature = new ActionsFeature()
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
}

module.exports = new PMX()
