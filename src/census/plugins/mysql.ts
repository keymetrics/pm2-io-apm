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

import { BasePlugin, Span } from '@pm2/opencensus-core'
import * as shimmer from 'shimmer'

export type MysqlPluginConfig = {
  /**
   * Add arguments to the span metadata for a every command
   */
  detailedCommands: boolean
}

/** MysqlDB instrumentation plugin for Opencensus */
export class MysqlPlugin extends BasePlugin {
  private readonly SPAN_MYSQL_QUERY_TYPE = 'MYSQL'

  protected options: MysqlPluginConfig
  protected readonly internalFileList = {
    '1 - 3': {
      'Connection': 'lib/Connection',
      'Pool': 'lib/Pool'
    }
  }

  /** Constructs a new MysqlPlugin instance. */
  constructor (moduleName: string) {
    super(moduleName)
  }

  /**
   * Patches Mysql operations.
   */
  protected applyPatch () {
    this.logger.debug('Patched Mysql')

    if (this.internalFilesExports.Connection) {
      this.logger.debug('patching mysql.Connection.createQuery')
      shimmer.wrap(this.internalFilesExports.Connection, 'createQuery', this.getPatchCreateQuery())
    }

    if (this.internalFilesExports.Pool) {
      this.logger.debug('patching mysql.Pool.prototype.getConnection')
      shimmer.wrap(this.internalFilesExports.Pool.prototype, 'getConnection', this.getPatchGetConnection())
    }

    return this.moduleExports
  }

  /** Unpatches all Mysql patched functions. */
  applyUnpatch (): void {
    shimmer.unwrap(this.internalFilesExports.Connection, 'createQuery')
    shimmer.unwrap(this.internalFilesExports.Pool.prototype, 'getConnection')
  }

  private getPatchCreateQuery() {
    const plugin = this
    return (original: Function) => {
      return function (...args: any[]) {
        const span = plugin.tracer.startChildSpan('mysql-query', plugin.SPAN_MYSQL_QUERY_TYPE)
        if (span === null) return original.apply(this, arguments)
        const query = original.apply(this, arguments)

        span.addAttribute('sql', query.sql)
        if (plugin.options.detailedCommands === true && query.values) {
          span.addAttribute('values', query.values)
        }
        if (typeof query._callback === 'function') {
          query._callback = plugin.patchEnd(span, query._callback)
        } else {
          query.on('end', function() {
            span.end()
          })
        }
        return query
      };
    }
  }

  private getPatchGetConnection() {
    const plugin = this
    return (original: Function) => {
      return function (cb) {
        return original.call(this, plugin.tracer.wrap(cb))
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
      if (resultHandler) {
        return resultHandler.apply(this, arguments);
      }
    };
    return this.tracer.wrap(patchedEnd)
  }
}

const plugin = new MysqlPlugin('mysql')
export { plugin }
