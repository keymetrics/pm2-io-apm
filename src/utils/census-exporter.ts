import {Exporter, ExporterBuffer, ExporterConfig, RootSpan, Span} from '@opencensus/core'
import {logger, Logger} from '@opencensus/core'
import {prototype} from 'events'
import * as http from 'http'
import * as url from 'url'
import { Transport, TransportConfig } from '../services/transport'
import { ServiceManager } from '../serviceManager'
import { TracingConfig } from 'src/features/tracing';

export interface ZipkinExporterOptions extends ExporterConfig {
  serviceName: string;
}

interface TranslatedSpan {
  traceId: string;
  name: string;
  id: string;
  parentId?: string;
  kind: string;
  timestamp: number;
  duration: number;
  debug: boolean;
  shared: boolean;
  localEndpoint: {serviceName: string};
}

/** Zipkin Exporter manager class */
export class CustomCensusExporter implements Exporter {
  private config: TracingConfig;
  private transport: Transport = ServiceManager.get('transport')
  buffer: ExporterBuffer;
  logger: Logger;

  constructor(config: TracingConfig) {
    this.config = config
    this.buffer = new ExporterBuffer(this, {})
    this.logger = logger.logger()
  }

  /**
   * Is called whenever a span is ended.
   * @param root the ended span
   */
  onEndSpan(root: RootSpan) {
    this.buffer.addToBuffer(root);
  }

  /** Not used for this exporter */
  onStartSpan(root: RootSpan) {}

  /**
   * Send a trace to zipkin service
   * @param zipkinTraces Trace translated to Zipkin Service
   */
  private sendTraces(zipkinTraces: TranslatedSpan[]) {
    return new Promise((resolve, reject) => {
      zipkinTraces.forEach(span => {
        if (span.kind !== undefined && span.kind === 'CLIENT' && !this.config.outboundHttp) return

        this.transport.send('trace-span', span)
      })
    })
  }

  /**
   * Mount a list (array) of spans translated to Zipkin format
   * @param rootSpans Rootspan array to be translated
   */
  private mountSpanList(rootSpans: RootSpan[]): TranslatedSpan[] {
    const spanList: TranslatedSpan[] = [];

    for (const root of rootSpans) {
      /** RootSpan data */
      spanList.push(this.translateSpan(root));

      // Builds spans data
      for (const span of root.spans) {
        spanList.push(this.translateSpan(span));
      }
    }

    return spanList;
  }

  /**
   * Translate OpenSensus Span to Zipkin format
   * @param span Span to be translated
   * @param rootSpan Only necessary if the span has rootSpan
   */
  private translateSpan(span: Span|RootSpan): TranslatedSpan {
    const spanTranslated = {
      traceId: span.traceId,
      name: span.name,
      id: span.id,
      parentId: span.parentSpanId,
      kind: span.kind || 'SERVER',
      timestamp: span.startTime.getTime() * 1000,
      duration: Math.round(span.duration * 1000),
      debug: true,
      shared: true,
      localEndpoint: {serviceName: this.config.serviceName},
      tags: span.attributes
    } as TranslatedSpan;

    return spanTranslated
  }

  // TODO: review return of method publish from exporter interface - today is
  // returning void
  /**
   * Send the rootSpans to zipkin service
   * @param rootSpans RootSpan array
   */
  publish(rootSpans: RootSpan[]) {
    const spanList = this.mountSpanList(rootSpans);

    return this.sendTraces(spanList).catch((err) => {
      return err;
    });
  }
}