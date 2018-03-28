import debug from 'debug'
import v8 from '../metrics/v8'
import MetricsFeature from '../features/metrics'
import DeepMetrics from '../metrics/deepMetrics'
import EventLoopDelayMetric from '../metrics/eventLoopDelay'
import MetricConfig from '../utils/metricConfig'

debug('axm:metricService')

export default class MetricsService {

  private services: Map<string, any>

  private defaultConf = {
    eventLoopDelay: true
  }

  constructor (metricsFeature: MetricsFeature) {
    this.services = new Map()
    this.services.set('v8', new v8(metricsFeature))
    this.services.set('deepMetrics', new DeepMetrics(metricsFeature))
    this.services.set('eventLoopDelay', new EventLoopDelayMetric(metricsFeature))
  }

  init (config?) {

    config = MetricConfig.getConfig(config, this.defaultConf)

    // init metrics only if they are enabled in config
    for (let property in config) {
      if (config.hasOwnProperty(property) && config[property] !== false) {
        if (!this.services.has(property)) {
          console.error(`Metric ${property} does not exist`)
          continue
        }

        const subConf = config[property]
        this.services.get(property).init(subConf)
      }
    }
  }

  destroyAll () {
    this.services.forEach( (service, serviceName) => {
      if (service.destroy && typeof service.destroy === 'function') {
        service.destroy()
      }
    })
  }

  get (name: string) {
    if (!this.services.has(name)) {
      debug(`Service ${name} not found !`)
      return null
    }

    return this.services.get(name)
  }
}
