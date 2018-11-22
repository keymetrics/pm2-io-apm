import { ServiceManager } from '../serviceManager'
import * as stringify from 'json-stringify-safe'
import { Feature } from '../featureManager'
import { Transport } from '../services/transport'
import * as Debug from 'debug'
import Configuration from '../configuration'

export class PluginConfig {
  connect?: boolean
  express?: boolean
  'generic-pool'?: boolean
  hapi?: boolean
  http?: boolean
  knex?: boolean
  koa?: boolean
  'mongodb-core'?: boolean
  mysql?: boolean
  pg?: boolean
  redis?: boolean
  restify?: boolean
}
export class TracerIgnoreFilter {
  url?: string[]
  method?: string[]
}

export class TracingConfig {
  enabled: boolean
  ignoreFilter?: TracerIgnoreFilter
  logLevel?: string
  /**
   * To disable a plugin in this list, you may override its path with a falsy
   * value. Disabling any of the default plugins may cause unwanted behavior,
   * so use caution.
   */
  plugins?: PluginConfig
  /**
   * An upper bound on the number of traces to gather each second. If set to 0,
   * sampling is disabled and all traces are recorded. Sampling rates greater
   * than 1000 are not supported and will result in at most 1000 samples per
   * second.
   */
  samplingRate?: number
}

const defaultConfig: TracingConfig = {
  enabled: true,
  ignoreFilter: {
    url: [ '/' ],
    method: [ 'OPTIONS' ]
  }
}

export class TracingFeature implements Feature {

  private transport: Transport
  private tracer: any
  private logger: any = Debug('axm:features:tracing')
  private traceHandler: Function
  
  init (config: TracingConfig | boolean): void {
    if (config === undefined) return
    if (config === false) return
    if (config === true) {
      config = defaultConfig
    }
    this.transport = ServiceManager.get('transport')

    const tracerModule = require('vxx')
    if (tracerModule.isActive()) {
      return this.logger(`Tracing already enalbed`)
    }

    this.tracer = tracerModule.start(config)
    this.logger(`Tracing start and correctly enabled`)

    Configuration.configureModule({
      tracing_enabled: true
    })
    this.traceHandler = (data) => {
      this.transport.send('axm:trace', data)
    }
    this.tracer.getBus().on('transaction', this.traceHandler)
  }

  destroy () {
    if (this.tracer === null) return
    this.tracer.getBus().removeAllListeners()
    // stop this instance to trace
    if (this.tracer.private_ === undefined && typeof this.tracer.private_.stop === 'function') {
      this.tracer.private_.stop()
    }
    if (typeof this.tracer.disable_ === 'function') {
      this.tracer.disable_()
    }
  }
}
