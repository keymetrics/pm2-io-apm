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

import { Func } from '@pm2/opencensus-core'
import { HttpPlugin } from './http'
import * as http from 'http'
import * as https from 'https'
import * as semver from 'semver'
import * as shimmer from 'shimmer'
import * as url from 'url'

/** Https instrumentation plugin for Opencensus */
export class HttpsPlugin extends HttpPlugin {
  /** Constructs a new HttpsPlugin instance. */
  constructor () {
    super('https')
  }

  /**
   * Patches HTTPS incoming and outcoming request functions.
   */
  protected applyPatch () {
    this.logger.debug('applying patch to %s@%s', this.moduleName, this.version)

    if (this.moduleExports && this.moduleExports.Server &&
        this.moduleExports.Server.prototype) {
      shimmer.wrap(
          this.moduleExports && this.moduleExports.Server &&
              this.moduleExports.Server.prototype,
          'emit', this.getPatchIncomingRequestFunction())
    } else {
      this.logger.error(
          'Could not apply patch to %s.emit. Interface is not as expected.',
          this.moduleName)
    }

    shimmer.wrap(
        this.moduleExports, 'request', this.getPatchHttpsOutgoingRequest())
    if (semver.satisfies(this.version, '>=8.0.0')) {
      shimmer.wrap(
        this.moduleExports, 'get', () => {
          // Re-implement https.get. This needs to be done (instead of using
          // makeRequestTrace to patch it) because we need to set the trace
          // context header before the returned ClientRequest is ended.
          // The Node.js docs state that the only differences between request and
          // get are that (1) get defaults to the HTTPs GET method and (2) the
          // returned request object is ended immediately.
          // The former is already true (at least in supported Node versions up to
          // v9), so we simply follow the latter.
          // Ref:
          // https://nodejs.org/dist/latest/docs/api/http.html#http_http_get_options_callback
          // https://github.com/googleapis/cloud-trace-nodejs/blob/master/src/plugins/plugin-http.ts#L198
          return function getTrace (options, callback) {
            const req = https.request(options, callback)
            req.end()
            return req
          }
        })
    }

    return this.moduleExports
  }

  /** Patches HTTPS outgoing requests */
  private getPatchHttpsOutgoingRequest () {
    return (original: Func<http.ClientRequest>): Func<http.ClientRequest> => {
      const plugin = this
      return function httpsOutgoingRequest (
                 options, callback): http.ClientRequest {
        // Makes sure options will have default HTTPS parameters
        if (typeof (options) !== 'string') {
          options.protocol = options.protocol || 'https:'
          options.port = options.port || 443
          options.agent = options.agent || https.globalAgent
        }
        return (plugin.getPatchOutgoingRequestFunction())(original)(
            options, callback)
      }
    }
  }

  /** Unpatches all HTTPS patched function. */
  protected applyUnpatch (): void {
    if (this.moduleExports && this.moduleExports.Server &&
        this.moduleExports.Server.prototype) {
      shimmer.unwrap(
          this.moduleExports && this.moduleExports.Server &&
              this.moduleExports.Server.prototype,
          'emit')
    }
    shimmer.unwrap(this.moduleExports, 'request')
    if (semver.satisfies(this.version, '>=8.0.0')) {
      shimmer.unwrap(this.moduleExports, 'get')
    }
  }
}

const plugin = new HttpsPlugin()
export { plugin }