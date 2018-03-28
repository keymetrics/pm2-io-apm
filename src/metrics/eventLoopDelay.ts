import MetricsFeature from '../features/metrics'
import MetricsInterface from './metricsInterface'

export default class EventLoopDelayMetric implements MetricsInterface {

  private timer
  private metricFeature: MetricsFeature
  private TIME_INTERVAL: number

  constructor (metricFeature: MetricsFeature) {
    this.TIME_INTERVAL = 1000
    this.metricFeature = metricFeature
  }

  init (config?: any | boolean) {
    let oldTime = process.hrtime()

    const histogram = this.metricFeature.histogram({
      name: 'Loop delay',
      type: 'libuv/latency',
      measurement: 'mean',
      unit: 'ms'
    })

    if (histogram) {
      this.timer = setInterval(() => {
        const newTime = process.hrtime()
        const delay = (newTime[0] - oldTime[0]) * 1e3 + (newTime[1] - oldTime[1]) / 1e6 - this.TIME_INTERVAL
        oldTime = newTime
        histogram.update(delay)
      }, this.TIME_INTERVAL)
    }
  }

  destroy () {
    clearInterval(this.timer)
  }
}
