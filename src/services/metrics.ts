import debug from 'debug'
import v8 from '../metrics/v8'
import MetricsFeature from '../features/metrics'

debug('axm:metricService')

export default class MetricsService {

  private services: Map<string, any>

  constructor (metricsFeature: MetricsFeature) {
    this.services = new Map()
    this.services.set('v8', new v8(metricsFeature))
  }

  init (config?) {

    // init metrics only if they are enabled in config
    for (let property in config) {
      if (config.hasOwnProperty(property) && config[property]) {
        if (!this.services.has(property)) {
          console.error(`Metric ${property} does not exist`)
          continue
        }

        const subConf = config[property]
        this.services.get(property).init(subConf)
      }
    }
  }

  get (name: string) {
    if (!this.services.has(name)) {
      debug(`Service ${name} not found !`)
      return null
    }

    return this.services.get(name)
  }
}
