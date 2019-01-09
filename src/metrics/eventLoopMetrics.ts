'use strict'

import { MetricService, InternalMetric, MetricType } from '../services/metrics'
import { ServiceManager } from '../serviceManager'
import * as Debug from 'debug'
import { MetricInterface } from '../features/metrics'
import Histogram from '../utils/metrics/histogram'
import { RuntimeStatsService } from 'src/services/runtimeStats'

export class EventLoopMetricOption {
  /**
   * Toggle the metrics about the actives handles/requests in the event loop
   * see http://docs.libuv.org/en/v1.x/design.html#handles-and-requests
   */
  eventLoopActive: boolean
  /**
   * Toggle the metrics about how much time the event loop use to make one loop
   * see http://docs.libuv.org/en/v1.x/design.html#the-i-o-loop
   */
  eventLoopDelay: boolean
}

const defaultOptions: EventLoopMetricOption = {
  eventLoopActive: true,
  eventLoopDelay: true
}

export default class EventLoopHandlesRequestsMetric implements MetricInterface {

  private metricService: MetricService | undefined
  private logger: any = Debug('axm:features:metrics:eventloop')
  private requestTimer: NodeJS.Timer | undefined
  private handleTimer: NodeJS.Timer | undefined
  private delayTimer: NodeJS.Timer | undefined
  private delayLoopInterval: number = 1000
  private runtimeStatsService: RuntimeStatsService | undefined
  private handle: (data: any) => void | undefined

  init (config?: EventLoopMetricOption | boolean) {
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
    if (typeof (process as any)._getActiveRequests === 'function' && config.eventLoopActive === true) {
      const requestMetric = this.metricService.metric({
        name : 'Active requests',
        id: 'internal/libuv/requests',
        historic: true
      })
      this.requestTimer = setInterval(_ => {
        requestMetric.set((process as any)._getActiveRequests().length)
      }, 1000)
      this.requestTimer.unref()
    }

    if (typeof (process as any)._getActiveHandles === 'function' && config.eventLoopActive === true) {
      const handleMetric = this.metricService.metric({
        name : 'Active handles',
        id: 'internal/libuv/handles',
        historic: true
      })
      this.handleTimer = setInterval(_ => {
        handleMetric.set((process as any)._getActiveHandles().length)
      }, 1000)
      this.handleTimer.unref()
    }

    if (config.eventLoopDelay === false) return

    const histogram = new Histogram()

    const uvLatencyp50: InternalMetric = {
      name: 'Event Loop Latency',
      id: 'internal/libuv/latency/p50',
      type: MetricType.histogram,
      historic: true,
      implementation: histogram,
      handler: function () {
        const percentiles = this.implementation.percentiles([ 0.5 ])
        if (percentiles[0.5] === null) return null
        return percentiles[0.5].toFixed(2)
      },
      unit: 'ms'
    }
    const uvLatencyp95: InternalMetric = {
      name: 'Event Loop Latency p95',
      id: 'internal/libuv/latency/p95',
      type: MetricType.histogram,
      historic: true,
      implementation: histogram,
      handler: function () {
        const percentiles = this.implementation.percentiles([ 0.95 ])
        if (percentiles[0.95] === null) return null
        return percentiles[0.95].toFixed(2)
      },
      unit: 'ms'
    }

    this.metricService.registerMetric(uvLatencyp50)
    this.metricService.registerMetric(uvLatencyp95)

    this.runtimeStatsService = ServiceManager.get('runtimeStats')
    if (this.runtimeStatsService === undefined) {
      this.logger('runtimeStats module not found, fallbacking into pure js method')
      let oldTime = process.hrtime()
      this.delayTimer = setInterval(() => {
        const newTime = process.hrtime()
        const delay = (newTime[0] - oldTime[0]) * 1e3 + (newTime[1] - oldTime[1]) / 1e6 - this.delayLoopInterval
        oldTime = newTime
        histogram.update(delay)
      }, this.delayLoopInterval)

      this.delayTimer.unref()
    } else {
      this.logger('using runtimeStats module as data source for event loop latency')
      this.handle = (stats: any) => {
        if (typeof stats !== 'object' || !Array.isArray(stats.ticks)) return
        stats.ticks.forEach((tick: number) => {
          histogram.update(tick)
        })
      }
      this.runtimeStatsService.on('data', this.handle)
    }
  }

  destroy () {
    if (this.requestTimer !== undefined) {
      clearInterval(this.requestTimer)
    }
    if (this.handleTimer !== undefined) {
      clearInterval(this.handleTimer)
    }
    if (this.delayTimer !== undefined) {
      clearInterval(this.delayTimer)
    }
    if (this.runtimeStatsService !== undefined) {
      this.runtimeStatsService.removeListener('data', this.handle)
    }
    this.logger('destroy')
  }
}
