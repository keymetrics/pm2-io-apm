import Proxy from '../utils/proxy'
import MetricsFeature from '../features/metrics'

export default class HttpWrapper {

  private metricFeature: MetricsFeature

  constructor (metricFeature: MetricsFeature) {
    this.metricFeature = metricFeature
  }

  init (opts, http) {

    let glMeter
    let glLatency

    glMeter = this.metricFeature.meter({
      name: 'HTTP',
      samples: 60,
      unit: 'req/min'
    })

    glLatency = this.metricFeature.histogram({
      measurement: 'mean',
      name: 'pmx:http:latency',
      unit: 'ms'
    })

    const ignoreRoutes = function (url) {
      for (let i = 0; i < opts.ignore_routes.length; ++i) {
        if (url.match(opts.ignore_routes[i]) !== null) {
          return true
        }
      }
      return false
    }

    Proxy.wrap(http.Server.prototype, ['on', 'addListener'], function (addListener) {
      return function (event, listener) {
        const self = this

        const overloadedFunction = function (request, response) {
          glMeter.mark()

          let httpStart = {
            url: request.url,
            start: Date.now()
          }

          response.once('finish', function () {

            if (!ignoreRoutes(httpStart.url)) {
              glLatency.update(Date.now() - httpStart.start)
            }
          })
        }

        if (!(event === 'request' && typeof listener === 'function')) {
          return addListener.apply(self, arguments)
        }

        if (self.__overloaded !== true) {

          self.on('removeListener', function onRemoveListener () {
            setTimeout(function () {
              if (self.listeners('request').length === 1) {
                self.removeListener('request', overloadedFunction)
                self.removeListener('removeListener', onRemoveListener)
                self.__overloaded = false
              }
            }, 200)
          })

          addListener.call(self, event, overloadedFunction)

          self.__overloaded = true
        }

        return addListener.apply(self, arguments)
      }
    })

    return http
  }
}
