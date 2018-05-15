import * as netModule from 'net'
import MetricsFeature from '../features/metrics'
import MetricsInterface from './metricsInterface'
import MetricConfig from '../utils/metricConfig'

import Debug from 'debug'
const debug = Debug('axm:network')

export default class NetworkMetric implements MetricsInterface {
  private metricFeature: MetricsFeature

  private defaultConf = {
    ports: false,
    traffic: true
  }

  constructor (metricFeature: MetricsFeature) {
    this.metricFeature = metricFeature
  }

  init (config?) {
    config = MetricConfig.getConfig(config, this.defaultConf)

    if (config.traffic) {
      this.catchTraffic(config.traffic)
    }

    if (config.ports) {
      this.catchPorts()
    }
  }

  destroy () {
    debug('NetworkMetric destroyed !')
  }

  catchPorts () {
    const portsList: Array<any> = []
    let openedPorts = 'N/A'

    this.metricFeature.metric({
      name    : 'Open ports',
      value   : function () { return openedPorts }
    })

    const originalListen = netModule.Server.prototype.listen

    netModule.Server.prototype.listen = function () {
      const port = parseInt(arguments[0], 10)

      if (!isNaN(port) && portsList.indexOf(port) === -1) {
        portsList.push(port)
        openedPorts = portsList.sort().join()
      }

      this.once('close', function () {
        if (portsList.indexOf(port) > -1) {
          portsList.splice(portsList.indexOf(port), 1)
          openedPorts = portsList.sort().join()
        }
      })

      return originalListen.apply(this, arguments)
    }
  }

  catchTraffic (config) {
    let download = 0
    let upload = 0
    let up = '0 B/sec'
    let down = '0 B/sec'

    const filter = function (bytes) {
      let toFixed = 0

      if (bytes < 1024) {
        toFixed = 6
      } else if (bytes < (1024 * 1024)) {
        toFixed = 3
      } else if (bytes !== 0) {
        toFixed = 2
      }

      bytes = (bytes / (1024 * 1024)).toFixed(toFixed)

      let cutZeros = 0

      for (let i = (bytes.length - 1); i > 0; --i) {
        if (bytes[i] === '.') {
          ++cutZeros
          break
        }
        if (bytes[i] !== '0') break
        ++cutZeros
      }

      if (cutZeros > 0) {
        bytes = bytes.slice(0, -(cutZeros))
      }

      return (bytes + ' MB/s')
    }

    const interval = setInterval(function () {
      up = filter(upload)
      down = filter(download)
      upload = 0
      download = 0
    }, 999)

    interval.unref()

    if (config === true || config.download === true) {
      this.metricFeature.metric({
        name: 'Network Download',
        agg_type: 'sum',
        value: function () {
          return down
        }
      })
    }

    if (config === true || config.upload === true) {
      this.metricFeature.metric({
        name: 'Network Upload',
        agg_type: 'sum',
        value: function () {
          return up
        }
      })
    }

    if (config === true || config.upload === true) {
      const originalWrite = netModule.Socket.prototype.write

      netModule.Socket.prototype.write = function (data) {
        if (data.length) {
          upload += data.length
        }
        return originalWrite.apply(this, arguments)
      }
    }

    if (config === true || config.download === true) {
      const originalRead = netModule.Socket.prototype.read

      netModule.Socket.prototype.read = function () {

        if (!this.monitored) {
          this.monitored = true

          this.on('data', function (data) {
            if (data.length) {
              download += data.length
            }
          })
        }

        return originalRead.apply(this, arguments)
      }
    }
  }
}
