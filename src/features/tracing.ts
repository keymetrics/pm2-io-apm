import { Feature } from '../featureManager'
import * as Debug from 'debug'
import Configuration from '../configuration'
import { IOConfig } from '../pmx'
import { resolve } from 'path'
import * as httpModule from 'http'
import { IgnoreMatcher } from '../census/plugins/http'
import * as core from '@opencensus/core'

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
  /**
   * Set to true when wanting to create span for raw TCP connection
   * instead of new http request
   */
  createSpanWithNet?: boolean
}

const httpMethodToIgnore = [
  'options',
  'head'
]
const defaultTracingConfig: TracingConfig = {
  enabled: false,
  outbound: false,
  samplingRate: 0,
  ignoreIncomingPaths: [],
  ignoreOutgoingUrls: [],
  detailedDatabasesCalls: false,
  createSpanWithNet: false
}

const enabledTracingConfig: TracingConfig = {
  enabled: true,
  outbound: false,
  samplingRate: 0.5,
  ignoreIncomingPaths: [
    (url, request) => {
      const method = (request.method || 'GET').toLowerCase()
      return httpMethodToIgnore.indexOf(method) > -1
    },
    /(.*).js/,
    /(.*).css/,
    /(.*).png/,
    /(.*).ico/,
    /(.*).svg/,
    /webpack/
  ],
  ignoreOutgoingUrls: [],
  detailedDatabasesCalls: false,
  createSpanWithNet: false
}

export class TracingFeature implements Feature {
  private exporter: any
  private options: TracingConfig
  private tracer: core.Tracing
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
      config.tracing.ignoreOutgoingUrls = enabledTracingConfig.ignoreOutgoingUrls
    }
    if (config.tracing.ignoreIncomingPaths === undefined) {
      config.tracing.ignoreIncomingPaths = enabledTracingConfig.ignoreIncomingPaths
    }

    const B3Format = require('@opencensus/propagation-b3').B3Format
    const CustomCensusExporter = require('../census/exporter').CustomCensusExporter
    const Tracing = require('../census/tracer').Tracing

    this.exporter = new CustomCensusExporter(this.options)
    if (this.tracer && this.tracer.active) {
      throw new Error(`Tracing was already enabled`)
    }
    this.logger('start census tracer')
    const tracer = Tracing.instance
    const plugins = {
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
      'mysql': {
        module: resolve(__dirname, '../census/plugins/mysql'),
        config: { detailedCommands: config.tracing.detailedDatabasesCalls }
      },
      'mysql2': {
        module: resolve(__dirname, '../census/plugins/mysql2'),
        config: { detailedCommands: config.tracing.detailedDatabasesCalls }
      },
      'redis': {
        module: resolve(__dirname, '../census/plugins/redis'),
        config: { detailedCommands: config.tracing.detailedDatabasesCalls }
      },
      'ioredis': {
        module: resolve(__dirname, '../census/plugins/ioredis'),
        config: { detailedCommands: config.tracing.detailedDatabasesCalls }
      },
      'pg': {
        module: resolve(__dirname, '../census/plugins/pg'),
        config: { detailedCommands: config.tracing.detailedDatabasesCalls }
      },
      'vue-server-renderer': {
        module: resolve(__dirname, '../census/plugins/vue'),
        config: {}
      }
    }
    if (this.options.createSpanWithNet === true) {
      plugins['net'] = {
        module: resolve(__dirname, '../census/plugins/net')
      }
    }
    this.tracer = tracer.start({
      exporter: this.exporter,
      plugins,
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

  getTracer (): core.TracerBase | undefined {
    return this.tracer ? this.tracer.tracer : undefined
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
