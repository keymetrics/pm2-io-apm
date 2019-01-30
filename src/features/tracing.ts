import { Feature } from '../featureManager'
import * as semver from 'semver'
import * as Debug from 'debug'
import Configuration from '../configuration'
import { IOConfig, defaultConfig } from '../pmx'
import { resolve } from 'path'

export class TracingConfig {
  enabled: boolean
  serviceName?: string
  /**
   * Generate trace for outgoing request that aren't connected to a incoming
   */
  outbound?: boolean
}

export class TracingFeature implements Feature {
  private exporter: any
  private options: TracingConfig
  private tracer: any
  private logger: Function = Debug('axm:tracing')

  async init (config: IOConfig): Promise<void> {
    this.logger('init tracing')

    this.options = config.tracing === undefined ? defaultConfig.tracing! : Object.assign(defaultConfig.tracing!, config.tracing)
    if (this.options && this.options.enabled) {
      if (!semver.satisfies(process.version, '>= 6.0.0')) {
        console.error('[TRACING] Unable to use tracing with node < 6.0.0')
        return process.exit(1)
      }

      // prepare service name
      if (config.apmOptions !== undefined && config.apmOptions.appName) {
        this.options.serviceName = config.apmOptions.appName
      } else if (process.env.name !== undefined) {
        this.options.serviceName = process.env.name.toString()
      }
      const CustomCensusExporter = require('../utils/census/exporter').CustomCensusExporter
      this.exporter = new CustomCensusExporter(this.options)

      await this.start(this.options)
    }
  }

  async start (config) {
    // don't enable tracing twice
    if (this.tracer && this.tracer.active) {
      throw new Error(`Tracing was already enabled`)
    }
    this.logger('start census tracer')

    const Tracing = require('../utils/census/tracer').Tracing
    const tracer = Tracing.instance
    this.tracer = tracer.start({
      exporter: this.exporter,
      plugins: {
        'http': resolve(__dirname, '../utils/census/plugins/http'),
        'http2': resolve(__dirname, '../utils/census/plugins/http2'),
        'https': resolve(__dirname, '../utils/census/plugins/https'),
        'mongodb': resolve(__dirname, '../utils/census/plugins/mongodb')
      }
      // propagation: new B3Format(),
      // logLevel: 4
    })
    Configuration.configureModule({
      census_tracing: true
    })
    return this.tracer
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
