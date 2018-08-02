import MetricsFeature from '../features/metrics'
import MetricsInterface from './metricsInterface'
import { ServiceManager } from '../serviceManager'

import Debug from 'debug'

const debug = Debug('axm:workers')

export default class WorkersMetric implements MetricsInterface {
  private metricFeature: MetricsFeature

  constructor (metricFeature: MetricsFeature) {
    this.metricFeature = metricFeature
  }

  init (config?: any | boolean) {
    this.metricFeature.metric({
      name: 'Child processes',
      value: () => {
        const dump = ServiceManager.get('eventLoopService').inspector.dump()
        return dump.handles.hasOwnProperty('ChildProcess') ? dump.handles.ChildProcess.length : 0
      }
    })

    this.metricFeature.metric({
      name: 'Threads',
      value: () => {
        const dump = ServiceManager.get('eventLoopService').inspector.dump()
        return dump.handles.hasOwnProperty('MessagePort') ? dump.handles.MessagePort.length : 0
      }
    })
  }

  destroy () {
    debug('WorkersMetric destroyed !')
  }
}
