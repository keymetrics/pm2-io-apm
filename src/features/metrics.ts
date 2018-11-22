import Debug from 'debug'
import { Feature } from '../featureManager'
import EventLoopHandlesRequestsMetric from '../metrics/eventLoopMetrics'
import NetworkMetric from '../metrics/network'
import { getObjectAtPath } from '../featureManager'
import HttpMetrics from '../metrics/httpMetrics';
import V8Metric from '../metrics/v8';
import GCMetrics from '../metrics/gc';

const debug = Debug('axm:features:metrics')

export const defaultMetricConf = {
  eventLoopDelay: true,
  eventLoopActive: true,
  transaction: {
    http: true
  },
  v8: true
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
    optionsPath: '.'
  },
  {
    name: 'http',
    module: HttpMetrics,
    optionsPath: 'transaction'
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
    optionsPath: 'v8.GC'
  }
]

export interface MetricInterface {
  init (config?: Object | boolean): void
  destroy (): void
}

export class MetricsFeature implements Feature {

  init (options?: Object) {
    if (typeof options !== 'object') options = {}

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
    for (let availableMetric of availableMetrics) {
      if (availableMetric.instance === undefined) continue
      availableMetric.instance.destroy()
    }
  }
}
