/**
 * Copyright 2018, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as EventEmitter from 'events'

import { BasePlugin, Span, SpanKind, SpanOptions } from '@opencensus/core'
import * as shimmer from 'shimmer'

export type PGPluginConfig = {
  /**
   * Add arguments to the span metadata for a every command
   */
  detailedCommands: boolean
}

/** PGDB instrumentation plugin for Opencensus */
export class PGPlugin extends BasePlugin {

  protected options: PGPluginConfig
  protected readonly internalFileList = {
    '6 - 7': {  // Support version 6 as well as 7
      'client': 'lib/client'  //Modified PG client path
    }
  }

  /** Constructs a new PGPlugin instance. */
  constructor (moduleName: string) {
    super(moduleName)
  }

  /**
   * Patches PG operations.
   */
  protected applyPatch () {
    this.logger.debug('Patched PG')

    if (this.internalFilesExports.client) {
      this.logger.debug('patching pq.client.prototype.query')
      shimmer.wrap(this.internalFilesExports.client.prototype, 'query', this.getPatchCreateQuery())
    }

    return this.moduleExports
  }

  /** Unpatches all PG patched functions. */
  applyUnpatch (): void {
    shimmer.unwrap(this.internalFilesExports.client.prototype, 'query')
  }

  private getPatchCreateQuery () {
    const plugin = this
    return (original: Function) => {
      return function (...args: any[]) {
        let spanOpts: SpanOptions = {name: 'pg-query', kind: SpanKind.CLIENT};
        const span = plugin.tracer.startChildSpan(spanOpts)
        if (span === null) return original.apply(this, arguments)

        let pgQuery

        if (arguments.length >= 1) {
          const args = Array.prototype.slice.call(arguments, 0)

          // Extract query text and values, if needed.
          plugin.populateLabelsFromInputs(span, args)

          // If we received a callback, bind it to the current context,
          // optionally adding labels as well.
          const callback = args[args.length - 1]
          if (typeof callback === 'function') {
            args[args.length - 1] = plugin.patchCallback(callback, span)
          } else if (typeof args[0] === 'object') {
            plugin.patchSubmittable(args[0], span)
          }
          pgQuery = original.apply(this, args)
        } else {
          pgQuery = original.apply(this, arguments)
        }

        if (pgQuery) {
          if (pgQuery instanceof EventEmitter) {
            plugin.tracer.wrapEmitter(pgQuery)
          } else if (typeof pgQuery.then === 'function') {
            plugin.patchPromise(pgQuery, span)
          }
        }
        return pgQuery
      }
    }
  }

  private patchCallback (callback, span) {
    const plugin = this
    return plugin.tracer.wrap((err, res) => {
      plugin.populateLabelsFromOutputs(span, err, res)
      span.end()
      callback(err, res)
    })
  }

  private patchSubmittable (pgQuery, span) {
    const plugin = this
    let spanEnded = false
    if (pgQuery.handleError) {
      shimmer.wrap(pgQuery, 'handleError', (origCallback) => {
        // Elements of args are not individually accessed.
        // tslint:disable:no-any
        return this.tracer.wrap(function (this, ...args: any[]): void {
          // tslint:enable:no-any
          if (!spanEnded) {
            const err: Error = args[0]
            plugin.populateLabelsFromOutputs(span, err)
            span.end()
            spanEnded = true
          }
          if (origCallback) {
            origCallback.apply(this, args)
          }
        })
      })
    }
    if (pgQuery.handleReadyForQuery) {
      shimmer.wrap(pgQuery, 'handleReadyForQuery', (origCallback) => {
        // Elements of args are not individually accessed.
        // tslint:disable:no-any
        return this.tracer.wrap(function (this, ...args: any[]): void {
          // tslint:enable:no-any
          if (!spanEnded) {
            plugin.populateLabelsFromOutputs(span, null, this._result)
            span.end()
            spanEnded = true
          }
          if (origCallback) {
            origCallback.apply(this, args)
          }
        })
      })
    }
    return pgQuery
  }

  private patchPromise (promise, span) {
    return promise = promise.then((res) => {
      plugin.populateLabelsFromOutputs(span, null, res)
      span.end()
      return res
    },
    (err) => {
      plugin.populateLabelsFromOutputs(span, err)
      span.end()
      throw err
    })
  }

  private populateLabelsFromInputs (span: Span, args: any) {
    const queryObj = args[0]
    if (typeof queryObj === 'object') {
      if (queryObj.text) {
        span.addAttribute('query', queryObj.text)
      }
      if (plugin.options.detailedCommands === true && queryObj.values) {
        span.addAttribute('values', queryObj.values)
      }
    } else if (typeof queryObj === 'string') {
      span.addAttribute('query', queryObj)
      if (plugin.options.detailedCommands === true && args.length >= 2 && typeof args[1] !== 'function') {
        span.addAttribute('values', args[1])
      }
    }
  }

  private populateLabelsFromOutputs (span: Span, err: Error | null, res?: any) {
    if (plugin.options.detailedCommands !== true) return

    if (err) {
      span.addAttribute('error', err.toString())
    }
    if (res) {
      span.addAttribute('row_count', res.rowCount)
      span.addAttribute('oid', res.oid)
      span.addAttribute('rows', res.rows)
      span.addAttribute('fields', res.fields)
    }
  }
}

const plugin = new PGPlugin('pg')
export { plugin }
