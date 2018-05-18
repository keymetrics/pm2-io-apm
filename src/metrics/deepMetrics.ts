import MetricsInterface from './metricsInterface'
import MetricsFeature from '../features/metrics'
import MetricConfig from '../utils/metricConfig'
import DeepMetricsTracer from './deepMetricsTracer'
import * as deepmetrics from 'deep-metrics'

import Debug from 'debug'
const debug = Debug('axm:deepMetrics')

export default class DeepMetrics implements MetricsInterface {
  private metricFeature: MetricsFeature

  private allPossibleMetrics = {}

  private defaultConf = {
    mongo: true,
    mysql: true,
    mqtt: true,
    socketio: true,
    redis: true,
    http: true,
    https: true,
    'http-outbound': true,
    'https-outbound': true
  }

  constructor (metricFeature: MetricsFeature) {
    this.metricFeature = metricFeature
  }

  init (config?: any | boolean) {
    deepmetrics.start()

    // instantiate all metrics
    for (let probeName in this.defaultConf) {
      if (this.defaultConf.hasOwnProperty(probeName)) {
        this.allPossibleMetrics[probeName] = new DeepMetricsTracer(this.metricFeature, deepmetrics.ee, probeName)
      }
    }

    config = MetricConfig.getConfig(config, this.defaultConf)

    // initialize only metrics found in config
    for (let probeName in this.allPossibleMetrics) {
      if (this.allPossibleMetrics.hasOwnProperty(probeName) && (config === 'all' || config[probeName] === true)) {
        this.allPossibleMetrics[probeName].init()
      }
    }
  }

  destroy () {

    deepmetrics.stop()

    // clean children
    for (let probeName in this.allPossibleMetrics) {
      if (this.allPossibleMetrics.hasOwnProperty(probeName)) {
        this.allPossibleMetrics[probeName].destroy()
      }
    }

    this.allPossibleMetrics = {}
    debug('Deep metrics detroyed !')
  }
}
