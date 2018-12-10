'use strict'

import { MetricService, MetricType } from '../services/metrics'
import { ServiceManager } from '../serviceManager'
import * as Debug from 'debug'
import { MetricInterface } from '../features/metrics'
import Histogram from '../utils/metrics/histogram'
import { RuntimeStatsService } from 'src/services/runtimeStats'

export class RuntimeMetricsOptions {
  gcOldPause: boolean
  gcNewPause: boolean
}

const defaultOptions: RuntimeMetricsOptions = {
  gcNewPause: true,
  gcOldPause: true
}

export default class RuntimeMetrics implements MetricInterface {

  private metricService: MetricService | undefined
  private logger: any = Debug('axm:features:metrics:runtime')
  private runtimeStatsService: RuntimeStatsService | undefined
  private handle: (data: Object) => void | undefined

  init (config?: RuntimeMetricsOptions | boolean) {
    if (config === false) return
    if (config === undefined) {
      config = defaultOptions
    }
    if (config === true) {
      config = defaultOptions
    }

    this.metricService = ServiceManager.get('metrics')
    if (this.metricService === undefined) return this.logger('Failed to load metric service')

    this.runtimeStatsService = ServiceManager.get('runtimeStats')
    if (this.runtimeStatsService === undefined) return this.logger('Failed to load runtime stats service')

    this.logger('init')

    const newHistogram = new Histogram()
    if (config.gcNewPause === true) {
      this.metricService.registerMetric({
        name: 'GC New Space Pause',
        id: 'internal/v8/gc/new/pause/p50',
        type: MetricType.histogram,
        historic: true,
        implementation: newHistogram,
        unit: 'ms',
        handler: function () {
          const percentiles = this.implementation.percentiles([ 0.5 ])
          return percentiles[0.5]
        }
      })
      this.metricService.registerMetric({
        name: 'GC New Space Pause p95',
        id: 'internal/v8/gc/new/pause/p95',
        type: MetricType.histogram,
        historic: true,
        implementation: newHistogram,
        unit: 'ms',
        handler: function () {
          const percentiles = this.implementation.percentiles([ 0.95 ])
          return percentiles[0.95]
        }
      })
    }

    const oldHistogram = new Histogram()
    if (config.gcOldPause === true) {
      this.metricService.registerMetric({
        name: 'GC Old Space Pause',
        id: 'internal/v8/gc/old/pause/p50',
        type: MetricType.histogram,
        historic: true,
        implementation: oldHistogram,
        unit: 'ms',
        handler: function () {
          const percentiles = this.implementation.percentiles([ 0.5 ])
          return percentiles[0.5]
        }
      })
      this.metricService.registerMetric({
        name: 'GC Old Space Pause p95',
        id: 'internal/v8/gc/old/pause/p95',
        type: MetricType.histogram,
        historic: true,
        implementation: oldHistogram,
        unit: 'ms',
        handler: function () {
          const percentiles = this.implementation.percentiles([ 0.95 ])
          return percentiles[0.95]
        }
      })
    }

    this.handle = (stats: any) => {
      if (typeof stats !== 'object' || typeof stats.gc !== 'object') return
      newHistogram.update(stats.gc.newPause)
      oldHistogram.update(stats.gc.oldPause)
    }

    this.runtimeStatsService.on('data', this.handle)
  }

  destroy () {
    if (this.runtimeStatsService !== undefined) {
      this.runtimeStatsService.removeListener('data', this.handle)
    }
    this.logger('destroy')
  }
}
