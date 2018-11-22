import * as v8 from 'v8'
import { MetricService, Metric } from '../services/metrics'
import { MetricInterface } from '../features/metrics'
import Debug from 'debug'
import { ServiceManager } from '../serviceManager'
import Gauge from '../utils/metrics/gauge'

export class V8MetricsConfig {
  new_space: boolean
  old_space: boolean
  map_space: boolean
  code_space: boolean
  large_object_space: boolean
  heap_total_size: boolean
  heap_used_size: boolean
  heap_used_percent: boolean
}

const defaultOptions: V8MetricsConfig = {
  new_space: true,
  old_space: true,
  map_space: true,
  code_space: true,
  large_object_space: true,
  heap_total_size: true,
  heap_used_size: true,
  heap_used_percent: true
}

export default class V8Metric implements MetricInterface {

  private timer: NodeJS.Timer
  private TIME_INTERVAL: number = 1000
  private metricService: MetricService | undefined
  private logger: Function = Debug('axm:features:metrics:v8')
  private metricStore: Map<string, Gauge> = new Map<string, Gauge>()

  private unitKB = 'kB'

  private metricsDefinitions = {
    new_space: {
      name: 'New space used size',
      id: 'internal/v8/heap/space/new',
      unit: this.unitKB,
      historic: true
    },
    old_space: {
      name: 'Old space used size',
      id: 'internal/v8/heap/space/old',
      unit: this.unitKB,
      historic: true
    },
    map_space: {
      name: 'Map space used size',
      id: 'internal/v8/heap/space/map',
      unit: this.unitKB,
      historic: false
    },
    code_space: {
      name: 'Code space used size',
      id: 'internal/v8/heap/space/code',
      unit: this.unitKB,
      historic: false
    },
    large_object_space: {
      name: 'Large object space used size',
      id: 'internal/v8/heap/space/large',
      unit: this.unitKB,
      historic: false
    },
    total_heap_size: {
      name: 'Heap size',
      id: 'internal/v8/heap/total',
      unit: 'kB',
      historic: true
    },
    heap_used_percent: {
      name: 'Heap Usage',
      id: 'internal/v8/heap/usage',
      unit: '%',
      historic: true
    },
    used_heap_size: {
      name: 'Used heap size',
      id: 'internal/v8/heap/used',
      unit: this.unitKB,
      historic: true
    }
  }


  init (config?: V8MetricsConfig | boolean) {
    if (config === false) return
    if (config === undefined) {
      config = defaultOptions
    }
    if (config === true) {
      config = defaultOptions
    }

    this.metricService = ServiceManager.get('metrics')
    if (this.metricService === undefined) return this.logger('Failed to load metric service')
    this.logger('init')
    
    if (!v8.hasOwnProperty('getHeapStatistics')) {
      return this.logger(`V8.getHeapStatistics is not available, aborting`)
    }

    for (let metricName in this.metricsDefinitions) {
      if (config[metricName] === false) continue
      let tmpGauge = new Gauge()
      let metric: Metric = config[metricName]
      this.metricStore.set(metricName, this.metricService.metric(metric))
    }

    this.timer = setInterval(() => {
      const stats = v8.getHeapStatistics()
      // update each metrics that we declared
      for (let metricName in this.metricsDefinitions) {
        if (typeof stats[metricName] !== 'number') continue
        const gauge = this.metricStore.get(metricName)
        if (gauge === undefined) continue
        gauge.set(stats[metricName])
      }
      // manually compute the heap usage
      const usage = (stats.used_heap_size / stats.total_heap_size).toFixed(2)
      const usageMetric = this.metricStore.get('heap_used_percent')
      if (usageMetric !== undefined) {
        usageMetric.set(parseFloat(usage))
      }
    }, this.TIME_INTERVAL)

    this.timer.unref()
  }

  destroy () {
    if (this.timer !== null) {
      clearInterval(this.timer)
    }
    this.logger('destroy')
  }
}
