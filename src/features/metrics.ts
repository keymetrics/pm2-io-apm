import Debug from 'debug'
import { Feature, getObjectAtPath } from '../featureManager'
import EventLoopHandlesRequestsMetric, { EventLoopMetricOption } from '../metrics/eventLoopMetrics'
import NetworkMetric, { NetworkTrafficConfig } from '../metrics/network'
import HttpMetrics, { HttpMetricsConfig } from '../metrics/httpMetrics'
import V8Metric, { V8MetricsConfig } from '../metrics/v8'
import GCMetrics, { GCMetricsOptions } from '../metrics/gc'

export const defaultMetricConf: MetricConfig = {
  eventLoop: true,
  network: false,
  http: true,
  gc: true,
  v8: true
}

export class MetricConfig {
  v8?: V8MetricsConfig | boolean
  gc?: GCMetricsOptions | boolean
  http?: HttpMetricsConfig | boolean
  network?: NetworkTrafficConfig | boolean
  eventLoop?: EventLoopMetricOption | boolean
}

class AvailableMetric {
  /**
   * Name of the feature
   */
  name: string
  /**
   * The non-instancied class of the feature, used to init it
   */
  module: { new(): MetricInterface }
  /**
   * Option path is the path of the configuration for this feature
   * Possibles values:
   *  - undefined: the feature doesn't need any configuration
   *  - '.': the feature need the top level configuration
   *  - everything else: the path to the value that contains the config, it can any anything
   */
  optionsPath?: string
  /**
   * Current instance of the feature used
   */
  instance?: MetricInterface
}

const availableMetrics: AvailableMetric[] = [
  {
    name: 'eventloop',
    module: EventLoopHandlesRequestsMetric,
    optionsPath: 'eventLoop'
  },
  {
    name: 'http',
    module: HttpMetrics,
    optionsPath: 'http'
  },
  {
    name: 'network',
    module: NetworkMetric,
    optionsPath: 'network'
  },
  {
    name: 'v8',
    module: V8Metric,
    optionsPath: 'v8'
  },
  {
    name: 'gc',
    module: GCMetrics,
    optionsPath: 'gc'
  }
]

export interface MetricInterface {
  init (config?: Object | boolean): void
  destroy (): void
}

export class MetricsFeature implements Feature {

  private logger: Function = Debug('axm:features:metrics')

  init (options?: Object) {
    if (typeof options !== 'object') options = {}
    this.logger('init')

    for (let availableMetric of availableMetrics) {
      const metric = new availableMetric.module()
      let config: any = undefined
      if (typeof availableMetric.optionsPath !== 'string') {
        config = {}
      } else if (availableMetric.optionsPath === '.') {
        config = options
      } else {
        config = getObjectAtPath(options, availableMetric.optionsPath)
      }
      // @ts-ignore
      // thanks mr typescript but we don't know the shape that the
      // options will be, so we just ignore the warning there
      metric.init(config)
      availableMetric.instance = metric
    }
  }

  destroy () {
    this.logger('destroy')
    for (let availableMetric of availableMetrics) {
      if (availableMetric.instance === undefined) continue
      availableMetric.instance.destroy()
    }
  }
}
