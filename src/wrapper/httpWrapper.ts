import { ServiceManager } from '../index'
import Transport from '../utils/transport'
import Proxy from '../utils/proxy'
import MetricsFeature from '../features/metrics'

export default class HttpWrapper {

  private transport: Transport
  private metricFeature: MetricsFeature

  constructor (metricFeature: MetricsFeature) {
    this.metricFeature = metricFeature
    this.transport = ServiceManager.get('transport')
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

    const httpWrapper = this

    Proxy.wrap(http.Server.prototype, ['on', 'addListener'], function (addListener) {
      return function (event, listener) {
        const self = this

        const overloadedFunction = function (request, response) {
          glMeter.mark()

          let httpStart = {
            url: request.url,
            method: request.method,
            start: Date.now(),
            ip: request.headers['x-forwarded-for'] ||
            (request.connection ? request.connection.remoteAddress : false) ||
            (request.socket ? request.socket.remoteAddress : false) ||
            ((request.connection && request.connection.socket) ? request.connection.socket.remoteAddress : false) || ''
          }

          response.once('finish', function () {

            if (!ignoreRoutes(httpStart.url)) {
              glLatency.update(Date.now() - httpStart.start)
            }

            if (((Date.now() - httpStart.start) >= opts.http_latency
                || response.statusCode >= opts.http_code)
              && !ignoreRoutes(httpStart.url)) {

              httpWrapper.transport.send({
                type: 'http:transaction',
                data: {
                  url: httpStart.url,
                  method: httpStart.method,
                  time: Date.now() - httpStart.start,
                  code: response.statusCode,
                  ip: httpStart.ip,
                  size: response.getHeader('Content-Length') || null
                }
              })
            }

            // httpStart = null
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
