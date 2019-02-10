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

import { BasePlugin, Func, Span } from '@pm2/opencensus-core'
import * as mongodb from 'mongodb'
import * as shimmer from 'shimmer'

export type MongoDB = typeof mongodb

export type MongoPluginConfig = {
  /**
   * Add arguments to the span metadata for a every command
   */
  detailedCommands: boolean
}

/** MongoDB instrumentation plugin for Opencensus */
export class MongoDBPlugin extends BasePlugin {
  private readonly SPAN_MONGODB_QUERY_TYPE = 'MONGODB-CLIENT'

  protected options: MongoPluginConfig
  protected readonly internalFileList = {
    '1 - 3': {
      'ConnectionPool': 'mongodb-core/lib/connection/pool'
    }
  }

  /** Constructs a new MongoDBPlugin instance. */
  constructor (moduleName: string) {
    super(moduleName)
  }

  /**
   * Patches MongoDB operations.
   */
  protected applyPatch () {
    this.logger.debug('Patched MongoDB')

    if (this.moduleExports.Server) {
      this.logger.debug('patching mongodb-core.Server.prototype functions: insert, remove, command, update')
      shimmer.wrap(this.moduleExports.Server.prototype, 'insert', this.getPatchCommand('mongodb-insert'))
      shimmer.wrap(this.moduleExports.Server.prototype, 'remove', this.getPatchCommand('mongodb-remove'))
      shimmer.wrap(this.moduleExports.Server.prototype, 'command', this.getPatchCommand('mongodb-command'))
      shimmer.wrap(this.moduleExports.Server.prototype, 'update', this.getPatchCommand('mongodb-update'))
    }

    if (this.moduleExports.Cursor) {
      this.logger.debug('patching mongodb-core.Cursor.prototype.next')
      shimmer.wrap(this.moduleExports.Cursor.prototype, 'next', this.getPatchCursor())
    }

    if (this.internalFilesExports.ConnectionPool) {
      this.logger.debug('patching mongodb-core/lib/connection/pool')
      shimmer.wrap(
        this.internalFilesExports.ConnectionPool.prototype, 'once' as never,
        this.getPatchEventEmitter())
    }

    return this.moduleExports
  }

  /** Unpatches all MongoDB patched functions. */
  applyUnpatch (): void {
    shimmer.unwrap(this.moduleExports.Server.prototype, 'insert')
    shimmer.unwrap(this.moduleExports.Server.prototype, 'remove')
    shimmer.unwrap(this.moduleExports.Server.prototype, 'command')
    shimmer.unwrap(this.moduleExports.Server.prototype, 'update')
    shimmer.unwrap(this.moduleExports.Cursor.prototype, 'next')
    shimmer.unwrap(this.internalFilesExports.ConnectionPool.prototype, 'once')
  }

  /** Creates spans for Command operations */
  private getPatchCommand (label: string) {
    const plugin = this
    return (original: Func<mongodb.Server>) => {
      return function (ns: string, command: any, options: any, callback: Function): mongodb.Server {
        const resultHandler = typeof options === 'function' ? options : callback
        if (plugin.tracer.currentRootSpan && typeof resultHandler === 'function') {
          let type: string
          if (command.createIndexes) {
            type = 'createIndexes'
          } else if (command.findandmodify) {
            type = 'findAndModify'
          } else if (command.ismaster) {
            type = 'isMaster'
          } else if (command.count) {
            type = 'count'
          } else {
            type = 'command'
          }

          const span = plugin.tracer.startChildSpan(label, plugin.SPAN_MONGODB_QUERY_TYPE)
          if (span === null) return original.apply(this, arguments)
          span.addAttribute('database', ns)
          span.addAttribute('type', type)

          if (plugin.options.detailedCommands === true) {
            span.addAttribute('command', JSON.stringify(command))
          }

          if (typeof options === 'function') {
            return original.call(this, ns, command, plugin.patchEnd(span, options))
          } else {
            return original.call(this, ns, command,
                options, plugin.patchEnd(span, callback))
          }
        }

        return original.apply(this, arguments)
      }
    }
  }

  /** Creates spans for Cursor operations */
  private getPatchCursor () {
    const plugin = this
    return (original: Func<mongodb.Cursor>) => {
      return function (...args: any[]): mongodb.Cursor {
        let resultHandler = args[0]
        if (plugin.tracer.currentRootSpan && typeof resultHandler === 'function') {
          const span = plugin.tracer.startChildSpan('mongodb-find', plugin.SPAN_MONGODB_QUERY_TYPE)
          if (span === null) return original.apply(this, arguments)

          resultHandler = plugin.patchEnd(span, resultHandler)
          span.addAttribute('database', this.ns)
          if (plugin.options.detailedCommands === true && typeof this.cmd.query === 'object') {
            span.addAttribute('command', JSON.stringify(this.cmd.query))
          }
        }

        return original.call(this, resultHandler)
      }
    }
  }
  /** Propagate context in the event emitter of the connection pool */
  private getPatchEventEmitter () {
    const plugin = this
    return (original: Function) => {
      return function (event, cb) {
        return original.call(this, event, plugin.tracer.wrap(cb))
      }
    }
  }

  /**
   * Ends a created span.
   * @param span The created span to end.
   * @param resultHandler A callback function.
   */
  patchEnd (span: Span, resultHandler: Function): Function {
    const plugin = this
    const patchedEnd = function (err, res) {
      if (plugin.options.detailedCommands === true && err instanceof Error) {
        span.addAttribute('error', err.message)
      }
      if (span.ended === false) {
        span.end()
      }
      return resultHandler.apply(this, arguments)
    }
    return this.tracer.wrap(patchedEnd)
  }
}

const plugin = new MongoDBPlugin('mongodb-core')
export { plugin }
