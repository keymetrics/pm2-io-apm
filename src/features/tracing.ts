import { Feature } from '../featureManager'
import * as Debug from 'debug'
import Configuration from '../configuration'
import { IOConfig } from '../pmx'
import { resolve } from 'path'
import { B3Format } from '@opencensus/propagation-b3'
import { CustomCensusExporter } from '../census/exporter'
import { Tracing } from '../census/tracer'
import * as httpModule from 'http'
import { IgnoreMatcher } from '../census/plugins/http'

export interface TracingConfig {
  /**
   * Enabled the distributed tracing feature.
   */
  enabled: boolean
  /**
   * If you want to report a specific service name
   * the default is the same as in apmOptions
   */
  serviceName?: string
  /**
   * Generate trace for outgoing request that aren't connected to a incoming one
   * default is false
   */
  outbound?: boolean
  /**
   * Determines the probability of a request to be traced. Ranges from 0.0 to 1.0
   * default is 0.5
   */
  samplingRate?: number,
  /**
   * Add details about databases calls (redis, mongodb)
   */
  detailedDatabasesCalls?: boolean,
  /**
   * Ignore specific incoming request depending on their path
   */
  ignoreIncomingPaths?: Array<IgnoreMatcher<httpModule.IncomingMessage>>
  /**
   * Ignore specific outgoing request depending on their url
   */
  ignoreOutgoingUrls?: Array<IgnoreMatcher<httpModule.ClientRequest>>
}

const defaultTracingConfig: TracingConfig = {
  enabled: false,
  outbound: false,
  samplingRate: 0,
  ignoreIncomingPaths: [],
  ignoreOutgoingUrls: [],
  detailedDatabasesCalls: false
}

const enabledTracingConfig: TracingConfig = {
  enabled: true,
  outbound: false,
  samplingRate: 0.5,
  ignoreIncomingPaths: [],
  ignoreOutgoingUrls: [],
  detailedDatabasesCalls: false
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
    if (config.tracing.ignoreOutgoingUrls === undefined) {
      config.tracing.ignoreOutgoingUrls = []
    }
    if (config.tracing.ignoreIncomingPaths === undefined) {
      config.tracing.ignoreIncomingPaths = []
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
        'http': {
          module: resolve(__dirname, '../census/plugins/http'),
          config: config.tracing
        },
        'http2': resolve(__dirname, '../census/plugins/http2'),
        'https': resolve(__dirname, '../census/plugins/https'),
        'mongodb-core': {
          module: resolve(__dirname, '../census/plugins/mongodb'),
          config: { detailedCommands: config.tracing.detailedDatabasesCalls }
        },
        'redis': {
          module: resolve(__dirname, '../census/plugins/redis'),
          config: { detailedCommands: config.tracing.detailedDatabasesCalls }
        }
      },
      propagation: new B3Format(),
      samplingRate: this.options.samplingRate || 0.5,
      logLevel: this.isDebugEnabled() ? 4 : 1
    })
    Configuration.configureModule({
      census_tracing: true
    })
  }

  private isDebugEnabled () {
    return typeof process.env.DEBUG === 'string' &&
      (process.env.DEBUG.indexOf('axm:*') >= 0 || process.env.DEBUG.indexOf('axm:tracing') >= 0)
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
