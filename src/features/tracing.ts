import { Feature } from '../featureManager'
import * as Debug from 'debug'
import Configuration from '../configuration'
import { IOConfig } from '../pmx'
import { resolve } from 'path'
import { B3Format } from '@opencensus/propagation-b3'
import { CustomCensusExporter } from '../census/exporter'
import { Tracing } from '../census/tracer'

export class TracingConfig {
  /**
   * Enabled the tracing infrastructure.
   */
  enabled: boolean
  /**
   * If you want to report a specific service name, by default we use the same
   * as in apmOptions
   */
  serviceName?: string
  /**
   * Generate trace for outgoing request that aren't connected to a incoming one
   */
  outbound?: boolean
  /**
   * Determines the probability of a request to be traced. Ranges from 0.0 to 1.0
   */
  samplingRate?: number
}

const defaultTracingConfig: TracingConfig = {
  enabled: false,
  outbound: false,
  samplingRate: 0
}

const enabledTracingConfig: TracingConfig = {
  enabled: true,
  outbound: false,
  samplingRate: 0.5
}

export class TracingFeature implements Feature {
  private exporter: any
  private options: TracingConfig
  private tracer: any
  private logger: Function = Debug('axm:tracing')

  init (config: IOConfig): void {
    this.logger('init tracing')

    if (config.tracing === undefined) {
      config.tracing = defaultTracingConfig
    } else if (config.tracing === true) {
      config.tracing = enabledTracingConfig
    } else if (config.tracing === false) {
      config.tracing = defaultTracingConfig
    }
    if (config.tracing.enabled === false) {
      return this.logger('tracing disabled')
    }

    this.options = Object.assign(enabledTracingConfig, config.tracing)
    // tslint:disable-next-line
    if (typeof config.apmOptions === 'object' && typeof config.apmOptions.appName === 'string') {
      this.options.serviceName = config.apmOptions.appName
    } else if (typeof process.env.name === 'string') {
      this.options.serviceName = process.env.name
    }
    this.exporter = new CustomCensusExporter(this.options)
    if (this.tracer && this.tracer.active) {
      throw new Error(`Tracing was already enabled`)
    }
    this.logger('start census tracer')
    const tracer = Tracing.instance
    this.tracer = tracer.start({
      exporter: this.exporter,
      plugins: {
        'http': resolve(__dirname, '../census/plugins/http'),
        'http2': resolve(__dirname, '../census/plugins/http2'),
        'https': resolve(__dirname, '../census/plugins/https'),
        'mongodb': resolve(__dirname, '../census/plugins/mongodb')
      },
      propagation: new B3Format(),
      samplingRate: this.options.samplingRate || 0.5
      // logLevel: 4
    })
    Configuration.configureModule({
      census_tracing: true
    })
  }

  destroy () {
    if (!this.tracer) return
    this.logger('stop census tracer')
    Configuration.configureModule({
      census_tracing: false
    })
    this.tracer.stop()
  }
}
