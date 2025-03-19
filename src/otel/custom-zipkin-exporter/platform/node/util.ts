/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { diag } from '@opentelemetry/api';
import { ExportResult, ExportResultCode } from '@opentelemetry/core';
import * as zipkinTypes from '../../types';
import { Transport } from '../../../../services/transport';
import { Constants } from '../../../constants';

/**
 * Prepares send function that will send spans to the remote Zipkin service.
 * @param urlStr - url to send spans
 * @param headers - headers
 * send
 */
export function prepareSend(
  transport: Transport,
  headers?: Record<string, string>
): zipkinTypes.SendFn {
  /**
   * Send spans to the remote Zipkin service.
   */
  return function send(
    zipkinSpans: zipkinTypes.Span[],
    done: (result: ExportResult) => void
  ) {
    // TODO: remove this log
    console.log('#CALL SEND zipkinSpans', zipkinSpans)
    if (zipkinSpans.length === 0) {
      diag.debug('Zipkin send with empty spans');
      return done({ code: ExportResultCode.SUCCESS });
    }

    zipkinSpans.forEach(span => {
      const isRootClient = span.kind === 'CLIENT' && !span.parentId
      if (isRootClient && this.config.outbound === false) return

      /* CUSTOM - DROP USELESS TRACE */
      if ((span.duration > Constants.MINIMUM_TRACE_DURATION)) {
        this.transport.send('trace-span', span)
      }
    })
  };
}
