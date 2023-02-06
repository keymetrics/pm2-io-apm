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

import { BasePlugin, TraceOptions, SpanKind } from '@opencensus/core'
import * as netModule from 'net'
import * as shimmer from 'shimmer'

/** Http instrumentation plugin for Opencensus */
export class NetPlugin extends BasePlugin {

  /** Constructs a new HttpPlugin instance. */
  constructor (moduleName: string) {
    super(moduleName)
  }

  /**
   * Patches HTTP incoming and outcoming request functions.
   */
  protected applyPatch () {
    this.logger.debug('applying patch to %s@%s', this.moduleName, this.version)

    if (this.moduleExports && this.moduleExports.Server &&
        this.moduleExports.Server.prototype) {
      shimmer.wrap(
          this.moduleExports.Server.prototype, 'emit',
          this.getPatchIncomingRequestFunction())
    } else {
      this.logger.error(
          'Could not apply patch to %s.emit. Interface is not as expected.',
          this.moduleName)
    }

    return this.moduleExports
  }

  /** Unpatches all HTTP patched function. */
  applyUnpatch (): void {
    if (this.moduleExports && this.moduleExports.Server &&
        this.moduleExports.Server.prototype) {
      shimmer.unwrap(this.moduleExports.Server.prototype, 'emit')
    } else {
      this.logger.error(
          'Could not unapply patch to %s.emit. Interface is not as expected.',
          this.moduleName)
    }
  }

  /**
   * Creates spans for incoming requests, restoring spans' context if applied.
   */
  protected getPatchIncomingRequestFunction () {
    return (original: (event: string) => boolean) => {
      const plugin = this
      // This function's signature is that of an event listener, which can have
      // any number of variable-type arguments.
      // tslint:disable-next-line:no-any
      return function incomingRequest (event: string, ...args: any[]): boolean {
        // Only traces request events
        if (event !== 'connection') {
          return original.apply(this, arguments)
        }

        const socket: netModule.Socket = args[0]

        plugin.logger.debug('%s plugin incomingRequest', plugin.moduleName)

        const traceOptions: TraceOptions = {
          name: 'socket',
          kind: SpanKind.SERVER,
          spanContext: undefined
        }

        return plugin.tracer.startRootSpan(traceOptions, rootSpan => {
          if (!rootSpan) return original.apply(this, arguments)

          plugin.tracer.wrapEmitter(socket)

          const address = socket.address()
          // if (typeof address === 'string') {
            rootSpan.addAttribute('net.address', address)
          // } else {
          //   rootSpan.addAttribute('net.host', address.address)
          //   rootSpan.addAttribute('net.port', address.port)
          //   rootSpan.addAttribute('net.family', address.family)
          // }

          socket.on('error', (err) => {
            rootSpan.addAttribute('net.error', err.message)
          })

          const originalEnd = socket.end
          socket.end = function () {
            if (rootSpan.ended === false) {
              rootSpan.end()
            }
            return originalEnd.apply(this, arguments)
          }

          socket.on('close', () => {
            if (rootSpan.ended === false) {
              rootSpan.end()
            }
          })

          return original.apply(this, arguments)
        })
      }
    }
  }
}

export const plugin = new NetPlugin('net')
