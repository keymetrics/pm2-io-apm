import MetricsFeature from '../features/metrics'

import * as util from 'util'
import Proxy from '../utils/proxy'
import SimpleHttpWrap from '../wrapper/httpWrapper'
import Debug from 'debug'
const debug = Debug('axm:tracing')
import Transport from '../utils/transport'
import Configuration from '../configuration'
import MetricsInterface from './metricsInterface'
import MetricConfig from '../utils/metricConfig'
import { ServiceManager } from '../serviceManager'

export default class Transaction implements MetricsInterface {

  private metricFeature: MetricsFeature
  private tracer

  private defaultConf = {
    http: true
  }

  constructor (metricFeature: MetricsFeature) {
    this.metricFeature = metricFeature
    ServiceManager.set('wrapper', {})
  }

  init (config?) {
    config = MetricConfig.getConfig(config, this.defaultConf)

    if (config.http) {
      const opts = typeof config.http === 'object' ? config.http : {}
      this.http(opts)
    }

    if (config.tracing) {
      const opts = typeof config.tracing === 'object' ? config.tracing : {}
      this.tracing(opts)
    }
  }

  destroy () {
    debug('Transaction destroyed !')
  }

  tracing (opts) {

    if (Array.isArray(opts.ignore_routes) && opts.ignore_routes.length > 0) {
      opts.ignoreFilter = { url: opts.ignore_routes }
    }

    // we should never enable tracing agent two time
    if (require('vxx').get().isActive()) return

    this.tracer = require('vxx').start(opts)

    Configuration.configureModule({
      tracing_enabled: true
    })

    // broadcast to pm2 aggregator
    this.tracer.getBus().on('transaction', (data) => {
      Transport.send({
        type: 'axm:trace',
        data: data
      })
    })
  }

  http (opts) {
    const Module = require('module')

    debug('Wrapping HTTP routes')

    if (Array.isArray(opts)) {
      const routes = JSON.parse(JSON.stringify(opts))
      opts = {
        http: true,
        http_latency: 200,
        http_code: 500,
        ignore_routes: routes
      }
    }

    opts = util['_extend']({
      http: true,
      http_latency: 200,
      http_code: 500,
      ignore_routes: []
    }, opts)

    const self = this
    Proxy.wrap(Module, '_load', (load) => {
      if (load.__axm_original) {
        debug('HTTP routes have already been wrapped before')

        Configuration.configureModule({
          latency: opts.http
        })

        if (opts.http === false) {
          return function (file) {
            return load.__axm_original.apply(this, arguments)
          }
        } else {
          return function (file) {
            if (file === 'http' || file === 'https') {
              return new SimpleHttpWrap(self.metricFeature).init(opts, load.__axm_original.apply(this, arguments))
            } else {
              return load.__axm_original.apply(this, arguments)
            }
          }
        }
      }

      return function (file) {

        if (opts.http &&
          (file === 'http' || file === 'https')) {
          debug('http module being required')
          Configuration.configureModule({
            latency: true
          })

          // initialize transaction metrics only once
          if (!ServiceManager.get('wrapper')[file]) {
            opts.name = file
            ServiceManager.get('wrapper')[file] = new SimpleHttpWrap(self.metricFeature).init(opts, load.apply(this, arguments))
          }
          return ServiceManager.get('wrapper')[file]

        } else {
          return load.apply(this, arguments)
        }
      }
    })
  }
}
