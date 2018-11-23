import { MetricService, InternalMetric, MetricType } from '../services/metrics'
import { ServiceManager } from '../serviceManager'
import * as Debug from 'debug'
import { MetricInterface } from '../features/metrics'
import Histogram from '../utils/metrics/histogram'

export class EventLoopMetricOption {
  eventLoopActive: boolean
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
    const _process = process as any
    if (typeof _process._getActiveRequests === 'function' && config.eventLoopActive === true) {
      const requestMetric = this.metricService.metric({
        name : 'Active requests',
        id: 'internal/libuv/requests',
        historic: true
      })
      this.requestTimer = setInterval(_ => {
        requestMetric.set(_process._getActiveRequests().length)
      }, 1000)
      this.requestTimer.unref()
    }

    if (typeof _process._getActiveHandles === 'function' && config.eventLoopActive === true) {
      const handleMetric = this.metricService.metric({
        name : 'Active handles',
        id: 'internal/libuv/handles',
        historic: true
      })
      this.handleTimer = setInterval(_ => {
        handleMetric.set(_process._getActiveHandles().length)
      }, 1000)
      this.handleTimer.unref()
    }

    const histogram = new Histogram()

    const uvLatencyp50: InternalMetric = {
      name: 'Event Loop Latency',
      id: 'internal/libuv/latency/p50',
      type: MetricType.histogram,
      historic: true,
      implementation: histogram,
      handler: () => {
        const percentiles = histogram.percentiles([ 0.95 ])
        return percentiles[0.95]
      },
      unit: 'ms'
    }
    const uvLatencyp95: InternalMetric = {
      name: 'Event Loop Latency p95',
      id: 'internal/libuv/latency/p95',
      type: MetricType.histogram,
      historic: true,
      implementation: histogram,
      handler: () => {
        const percentiles = histogram.percentiles([ 0.5 ])
        return percentiles[0.5]
      },
      unit: 'ms'
    }

    if (config.eventLoopDelay === false) return

    this.metricService.registerMetric(uvLatencyp50)
    this.metricService.registerMetric(uvLatencyp95)

    let oldTime = process.hrtime()
    this.delayTimer = setInterval(() => {
      const newTime = process.hrtime()
      const delay = (newTime[0] - oldTime[0]) * 1e3 + (newTime[1] - oldTime[1]) / 1e6 - this.delayLoopInterval
      oldTime = newTime
      histogram.update(delay)
    }, this.delayLoopInterval)

    this.delayTimer.unref()
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
    this.logger('destroy')
  }
}
