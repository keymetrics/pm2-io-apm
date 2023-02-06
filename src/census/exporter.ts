import { Transport } from '../services/transport'
import { ServiceManager } from '../serviceManager'
import { TracingConfig } from 'src/features/tracing'
import { Exporter, ExporterBuffer, ExporterConfig, Span, SpanKind, Attributes, CanonicalCode } from '@opencensus/core'
import { defaultConfig } from './config/default-config'
import { Constants } from './constants'

export interface ZipkinExporterOptions extends ExporterConfig {
  serviceName: string
}

enum CanonicalCodeString {
  OK = 'OK',
  CANCELLED = 'CANCELLED',
  UNKNOWN = 'UNKNOWN',
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',
  DEADLINE_EXCEEDED = 'DEADLINE_EXCEEDED',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  FAILED_PRECONDITION = 'FAILED_PRECONDITION',
  ABORTED = 'ABORTED',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  UNIMPLEMENTED = 'UNIMPLEMENTED',
  INTERNAL = 'INTERNAL',
  UNAVAILABLE = 'UNAVAILABLE',
  DATA_LOSS = 'DATA_LOSS',
  UNAUTHENTICATED = 'UNAUTHENTICATED'
}

interface TranslatedSpan {
  traceId: string
  name: string
  id: string
  parentId?: string
  kind: string
  timestamp: number
  duration: number
  debug: boolean
  shared: boolean
  localEndpoint: {serviceName: string},
  tags: Attributes
}

/** Zipkin Exporter manager class */
export class CustomCensusExporter implements Exporter {
  private config: TracingConfig
  private transport: Transport = ServiceManager.get('transport')
  buffer: ExporterBuffer

  constructor (config: TracingConfig) {
    this.config = config
    this.buffer = new ExporterBuffer(this, defaultConfig)
  }

  /**
   * Is called whenever a span is ended.
   * @param root the ended span
   */
  onEndSpan (root: Span) {
    this.buffer.addToBuffer(root)
  }

  //tslint:disable-next-line:no-empty
  onStartSpan (root: Span) {}

  /**
   * Send a trace to zipkin service
   * @param zipkinTraces Trace translated to Zipkin Service
   */
  private sendTraces (zipkinTraces: TranslatedSpan[]) {
    return new Promise((resolve, reject) => {
      zipkinTraces.forEach(span => {
        const isRootClient = span.kind === 'CLIENT' && !span.parentId
        if (isRootClient && this.config.outbound === false) return

        /* CUSTOM - DROP USELESS TRACE */
        if (process.env.NODE_ENV === 'test' || (span.duration > Constants.MINIMUM_TRACE_DURATION)) {
          this.transport.send('trace-span', span)
        }
      })
      resolve("")
    })
  }


  /**
   * Mount a list (array) of spans translated to Zipkin format
   * @param rootSpans Rootspan array to be translated
   */
  private mountSpanList (rootSpans: Span[]): TranslatedSpan[] {
    const spanList: TranslatedSpan[] = []

    for (const root of rootSpans) {
      /** RootSpan data */
      spanList.push(this.translateSpan(root))

      // Builds spans data
      for (const span of root.spans) {
        spanList.push(this.translateSpan(span))
      }
    }

    return spanList
  }

  /**
   * Translate OpenSensus Span to Zipkin format
   * @param span Span to be translated
   * @param rootSpan Only necessary if the span has rootSpan
   */
  private translateSpan (span: Span): TranslatedSpan {
    const spanTranslated = {
      traceId: span.traceId,
      name: span.name,
      id: span.id,
      parentId: span.parentSpanId,
      kind: this.getSpanKind(span.kind),
      timestamp: span.startTime.getTime() * 1000,
      duration: Math.round(span.duration * 1000),
      debug: false,
      shared: false,
      localEndpoint: { serviceName: this.config.serviceName },
      tags: span.attributes
    } as TranslatedSpan

    if (typeof spanTranslated.tags['result.code'] !== 'string') {
      spanTranslated.tags['result.code'] = CanonicalCodeString[span.status.code]
    }
    if (typeof span.status.message === 'string') {
      spanTranslated.tags['result.message'] = span.status.message
    }

    return spanTranslated
  }

 
  /**
   * Send the rootSpans to zipkin service
   * @param rootSpans RootSpan array
   */
  publish (rootSpans: Span[]) {
    const spanList = this.mountSpanList(rootSpans)

    return this.sendTraces(spanList).catch((err) => {
      return err
    })
  }

  private getSpanKind (kind: SpanKind) {
    switch (kind) {
      case SpanKind.CLIENT: {
        return 'CLIENT'
      }
      case SpanKind.SERVER: {
        return 'SERVER'
      }
      default: {
        return 'UNKNOWN'
      }
    }
  }
}
