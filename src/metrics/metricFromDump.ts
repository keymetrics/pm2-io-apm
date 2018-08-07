import MetricsFeature from '../features/metrics'
import MetricsInterface from './metricsInterface'
import MiscUtils from '../utils/miscellaneous'

import Debug from 'debug'

const debug = Debug('axm:metricfromdump')

export default class MetricFromDump implements MetricsInterface {
  private metricFeature: MetricsFeature
  private conf

  constructor (metricFeature: MetricsFeature, conf) {
    this.conf = Array.isArray(conf) ? conf : [conf]
    this.metricFeature = metricFeature
  }

  init () {
    const self = this

    for (let i = 0; i < this.conf.length; i++) {
      (function (index) {
        self.metricFeature.metric({
          name: self.conf[index].name,
          value: () => {
            return MiscUtils.getValueFromDump(self.conf[index].property, self.conf[index].parentProperty)
          }
        })
      })(i)
    }
  }

  destroy () {
    debug(`${this.conf.name} metric destroyed !`)
  }
}
