import MetricsFeature from '../features/metrics'
import MetricsInterface from './metricsInterface'

import Debug from 'debug'
const debug = Debug('axm:eventLoop')

export default class EventLoopHandlesRequestsMetric implements MetricsInterface {
  private metricFeature: MetricsFeature

  constructor (metricFeature: MetricsFeature) {
    this.metricFeature = metricFeature
  }

  init (config?: any | boolean) {
    if (typeof this.getProcess()._getActiveRequests === 'function') {
      this.metricFeature.metric({
        name : 'Active requests',
        type: 'internal/libuv/requests',
        value: () => { return this.getProcess()._getActiveRequests().length }
      })
    }

    if (typeof this.getProcess()._getActiveHandles === 'function') {
      this.metricFeature.metric({
        name : 'Active handles',
        type: 'internal/libuv/handles',
        value: () => { return this.getProcess()._getActiveHandles().length }
      })
    }
  }

  destroy () {
    debug('EventLoopHandlesRequestsMetric destroyed !')
  }

  private getProcess (): any {
    return process
  }
}
