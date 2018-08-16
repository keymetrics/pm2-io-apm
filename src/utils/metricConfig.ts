import * as merge from 'deepmerge'

export default class MetricConfig {
  static getConfig (config, defaultConf) {
    if (!config || config === true) {
      config = defaultConf
    } else if (config !== 'all') {
      config = merge(defaultConf, config)
    }

    return config
  }

  static initProbes (allPossibleMetrics, config, metricFeature) {
    const probes = {}

    for (let metricName in allPossibleMetrics) {
      if (allPossibleMetrics.hasOwnProperty(metricName) && (config === 'all' || config[metricName] === true)) {
        probes[metricName] = metricFeature.metric(allPossibleMetrics[metricName])
      }
    }

    return probes
  }

  static setProbesValue (allPossibleMetrics, metrics, probes, defaultUnit) {
    if (!metrics) return
    for (let metricName in metrics) {
      if (metrics.hasOwnProperty(metricName) && probes.hasOwnProperty(metricName)) {
        const value = (allPossibleMetrics[metricName].unit === defaultUnit) ? Math.round(metrics[metricName] / 1000) : metrics[metricName]
        probes[metricName].set(value)
      }
    }
  }

  static buildConfig (config) {
    if (typeof config === 'string') {
      config = {
        name: config
      }
    }

    return config
  }
}
