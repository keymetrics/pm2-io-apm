import * as netModule from 'net'
import { MetricService, MetricType } from '../services/metrics'
import { MetricInterface } from '../features/metrics'
import * as Debug from 'debug'
import Meter from '../utils/metrics/meter'
import * as shimmer from 'shimmer'
import { ServiceManager } from '../serviceManager'

export class NetworkTrafficConfig {
  upload: boolean
  download: boolean
}

export class NetworkMetricConfig {
  traffic: boolean | NetworkTrafficConfig
}

const defaultConfig: NetworkMetricConfig = {
  traffic: {
    upload: false,
    download: false
  }
}

const allEnabled: NetworkMetricConfig = {
  traffic: {
    upload: true,
    download: true
  }
}

export default class NetworkMetric implements MetricInterface {
  private metricService: MetricService | undefined
  private timer: NodeJS.Timer | undefined
  private logger: Function = Debug('axm:features:metrics:network')
  private socketProto: any

  init (config?: NetworkMetricConfig | boolean) {
    if (config === false) return
    if (config === true) {
      config = allEnabled
    }
    if (config === undefined) {
      config = defaultConfig
    }

    if (config.traffic === true) {
      config.traffic = {
        upload: true,
        download: true
      }
    }

    if (config.traffic === false) return

    this.metricService = ServiceManager.get('metrics')
    if (this.metricService === undefined) {
      return this.logger(`Failed to load metric service`)
    }

    if (config.traffic.download === true) {
      this.catchDownload()
    }
    if (config.traffic.upload === true) {
      this.catchUpload()
    }
    this.logger('init')
  }

  destroy () {
    if (this.timer !== undefined) {
      clearTimeout(this.timer)
    }

    if (this.socketProto !== undefined && this.socketProto !== null) {
      shimmer.unwrap(this.socketProto, 'read')
      shimmer.unwrap(this.socketProto, 'write')
    }

    this.logger('destroy')
  }

  private catchDownload () {
    if (this.metricService === undefined) return this.logger(`Failed to load metric service`)
    const downloadMeter = new Meter({})
    this.metricService.registerMetric({
      name: 'Network In',
      id: 'internal/network/in',
      historic: true,
      type: MetricType.meter,
      implementation: downloadMeter,
      unit: 'MBytes/sec',
      handler: function () {
        return this.implementation.val() / 1024 / 1024
      }
    })

    setTimeout(() => {
      const property = netModule.Socket.prototype.read
      // @ts-ignore thanks mr typescript but we are monkey patching here
      const isWrapped = property && property.__wrapped === true
      if (isWrapped) {
        return this.logger(`Already patched socket read, canceling`)
      }
      shimmer.wrap(netModule.Socket.prototype, 'read', function (original) {
        return function () {
          this.on('data', (data) => {
            if (typeof data.length === 'number') {
              downloadMeter.mark(data.length)
            }
          })
          return original.apply(this, arguments)
        }
      })
    }, 500)
  }

  private catchUpload () {
    if (this.metricService === undefined) return this.logger(`Failed to load metric service`)
    const uploadMeter = new Meter()
    this.metricService.registerMetric({
      name: 'Network Out',
      id: 'internal/network/out',
      type: MetricType.meter,
      historic: true,
      implementation: uploadMeter,
      unit: 'MBytes/sec',
      handler: function () {
        return this.implementation.val() / 1024 / 1024
      }
    })

    setTimeout(() => {
      const property = netModule.Socket.prototype.write
      // @ts-ignore thanks mr typescript but we are monkey patching here
      const isWrapped = property && property.__wrapped === true
      if (isWrapped) {
        return this.logger(`Already patched socket write, canceling`)
      }
      shimmer.wrap(netModule.Socket.prototype, 'write', function (original) {
        return function (data) {
          if (typeof data.length === 'number') {
            uploadMeter.mark(data.length)
          }
          return original.apply(this, arguments)
        }
      })
    }, 500)
  }
}
