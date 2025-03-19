import { Feature } from '../featureManager'
import * as Debug from 'debug'
import Configuration from '../configuration'
import { IOConfig } from '../pmx'

import {
  trace,
  Tracer,
} from "@opentelemetry/api";

import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { CustomZipkinExporter } from '../otel/custom-zipkin-exporter/zipkin';

import * as httpModule from 'http'
import { IncomingMessage } from 'http';


export type IgnoreMatcher<T> = string | RegExp | ((url: string, request: T) => boolean)

export type HttpPluginConfig = {
  /**
   * Ignore specific incoming request depending on their path
   */
  ignoreIncomingPaths: Array<IgnoreMatcher<httpModule.IncomingMessage>>
  /**
   * Ignore specific outgoing request depending on their url
   */
  ignoreOutgoingUrls: Array<IgnoreMatcher<httpModule.ClientRequest>>
  /**
   * Disable the creation of root span with http server
   * mainly used if net plugin is implemented
   */
  createSpanWithNet: boolean
}

export type HttpModule = typeof httpModule
export type RequestFunction = typeof httpModule.request

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
  enabled: true,
  outbound: false,
  samplingRate: 0,
  ignoreIncomingPaths: [],
  ignoreOutgoingUrls: [],
  createSpanWithNet: false
}

const enabledTracingConfig: TracingConfig = {
  enabled: true,
  outbound: true,
  samplingRate: 0.5,
  ignoreIncomingPaths: [
    (_url, request) => {
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
  createSpanWithNet: false
}

export class TracingFeature implements Feature {
  private options: TracingConfig
  private logger: Function = Debug('axm:tracing')
  private otel: NodeSDK | undefined;

  init (config: IOConfig): void {
    config.tracing = enabledTracingConfig;

    // TODO: review FF approach

    // if (config.tracing === undefined) {
    //   config.tracing = enabledTracingConfig
    // } else if (config.tracing === true) {
    //   config.tracing = enabledTracingConfig
    // } else if (config.tracing === false) {
    //   config.tracing = enabledTracingConfig
    // }
    // if (config.tracing.enabled === false) {
    //   console.log('tracing disabled ????' ,{config})
    //   // return console.log('tracing disabled')
    // }

    this.options = enabledTracingConfig

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

    const traceExporter = new CustomZipkinExporter();

		const serviceName =
			process.env.OTEL_SERVICE_NAME ||
			  this.options.serviceName;

		this.otel = new NodeSDK({
      traceExporter,
			serviceName,
			instrumentations: [
				getNodeAutoInstrumentations({
					"@opentelemetry/instrumentation-dns": {
						enabled: false,
					},
					"@opentelemetry/instrumentation-fs": {
						enabled: false,
					},
					"@opentelemetry/instrumentation-net": {
						enabled: this.options.createSpanWithNet,
					},
					"@opentelemetry/instrumentation-http": {
            ignoreIncomingRequestHook: (request: IncomingMessage) => {
              if (!this.options.ignoreIncomingPaths) {
                return false
              }
              return this.options.ignoreIncomingPaths.some((matcher) => applyMatcher(matcher, request))
            },
            ignoreOutgoingRequestHook: (request: IncomingMessage) => {
              if (!this.options.ignoreOutgoingUrls) {
                return false
              }
              return this.options.ignoreOutgoingUrls.some((matcher) => applyMatcher(matcher, request))
            },
					},
				}),
			],
		});

		this.otel.start();

    Configuration.configureModule({
      census_tracing: true
    })
  }

  private isDebugEnabled () {
    return true
    // return typeof process.env.DEBUG === 'string' &&
    //   (process.env.DEBUG.indexOf('axm:*') >= 0 || process.env.DEBUG.indexOf('axm:tracing') >= 0)
  }

  getTracer (): Tracer {
    if (!this.options.serviceName) {
      throw new Error('serviceName is required')
    }
    return trace.getTracer(this.options.serviceName)
  }

  destroy () {
    if (!this.otel) return
    console.log('stop census tracer')
    // TODO: handle as blocking
    this.otel.shutdown();

    Configuration.configureModule({
      census_tracing: false
    })
  }
}

function applyMatcher(matcher: IgnoreMatcher<unknown>, request: IncomingMessage) {
  console.log('applyMatcher', {matcher, request})
  if (!matcher) {
    console.log('no matcher')
    return false
  }
  if (!request.url) {
    console.log('no request url')
    return false
  }

  if (typeof matcher === 'string') {
    console.log('matcher is string')
    return request.url.includes(matcher)
  }
  if (matcher instanceof RegExp) {
    console.log('matcher is RegExp')
    return matcher.test(request.url)
  }
  console.log('matcher is function')
  return matcher(request.url, request)
}
