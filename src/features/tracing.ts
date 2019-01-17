import { Feature } from '../featureManager'
import * as semver from 'semver'
import * as Debug from 'debug'
import { CustomCensusExporter } from '../utils/census-exporter'
import * as tracing from '@opencensus/nodejs'
import * as core from '@opencensus/core'
import Configuration from '../configuration'
import { IOConfig, defaultConfig } from '../pmx'

const debug = Debug('axm:tracing')

export class TracingConfig {
  enabled: boolean
  serviceName?: string
  outboundHttp?: boolean
}

export class TracingFeature implements Feature {
  private exporter: CustomCensusExporter
  private options: TracingConfig
  private tracer: core.Tracing | null

  async init (config: IOConfig): Promise<void> {
    debug('init tracing')
    if (!semver.satisfies(process.version, '>= 6.0.0')) {
      console.error('[STANDALONE MODE] Unable to set standalone mode with node < 6.0.0')
      return process.exit(1)
    }

    this.options = config.tracing === undefined ? defaultConfig.tracing! : Object.assign(defaultConfig.tracing!, config.tracing)
    if (this.options && this.options.enabled) {
      // prepare service name
      if (config.apmOptions !== undefined && config.apmOptions.appName) {
        this.options.serviceName = config.apmOptions.appName
      } else if (process.env.name !== undefined) {
        this.options.serviceName = process.env.name.toString()
      }

      this.exporter = new CustomCensusExporter(this.options)
      await this.start(this.options)
    }
  }

  async start (config) {
    // don't enable tracing twice
    if (this.tracer && this.tracer.active) {
      throw new Error(`Tracing was already enabled`)
    }
    debug('start census tracer')
    this.tracer = tracing.start({
      exporter: this.exporter
    })
    Configuration.configureModule({
      census_tracing: true
    })
    return this.tracer
  }

  async stop () {
    if (!this.tracer) throw new Error(`Tracing was not enabled`)
    debug('stop census tracer')
    Configuration.configureModule({
      census_tracing: false
    })
    return this.tracer.stop()
  }

  async destroy () {
    if (!this.tracer) return
    await this.stop()
  }
}
