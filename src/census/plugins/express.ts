
'use strict'

import { BasePlugin, Span, SpanKind } from '@opencensus/core'
import * as shimmer from 'shimmer'
import * as semver from 'semver'
import * as express from 'express'

export const kMiddlewareStack = Symbol('express-middleware-stack')

/** express instrumentation plugin for Opencensus */
export class ExpressPlugin extends BasePlugin {

  private kPatched = Symbol('express-layer-patched')

  /** Constructs a new instance. */
  constructor (moduleName: string) {
    super(moduleName)
  }

  /**
   * Patches functions.
   */
  protected applyPatch () {
    this.logger.debug('Patched express')

    if (!semver.satisfies(this.version, '^4.0.0')) {
      this.logger.debug('express version %s not supported - aborting...', this.version)
      return this.moduleExports
    }

    if (this.moduleExports) {
      const routerProto: express.Router = semver.satisfies(this.version, '^5')
        ? (this.moduleExports.Router && this.moduleExports.Router.prototype)
        : this.moduleExports.Router
      const plugin = this

      this.logger.debug('patching express.Router.prototype.route')
      shimmer.wrap(routerProto, 'route', (original: Function) => {
        return function route_trace (path) {
          const route = original.apply(this, arguments)
          const layer = this.stack[this.stack.length - 1]
          plugin.applyLayerPatch(layer, path)
          return route
        }
      })
      this.logger.debug('patching express.Router.prototype.use')
      shimmer.wrap(routerProto, 'use', (original: Function) => {
        return function use (path: string) {
          const route = original.apply(this, arguments)
          const layer = this.stack[this.stack.length - 1]
          plugin.applyLayerPatch(layer, path)
          return route
        }
      })
      this.logger.debug('patching express.Application.use')
      shimmer.wrap(this.moduleExports.application, 'use', (original: Function) => {
        return function use (path: string) {
          const route = original.apply(this, arguments)
          const layer = this._router.stack[this._router.stack.length - 1]
          plugin.applyLayerPatch(layer, path)
          return route
        }
      })
    }
    return this.moduleExports
  }

  /** Unpatches all patched functions. */
  applyUnpatch (): void {
    // do not remove patchs if the module wasn't patched
    if (!semver.satisfies(this.version, '^4.0.0')) {
      return this.moduleExports
    }
    const routerProto: express.Router = semver.satisfies(this.version, '^5')
        ? (this.moduleExports.Router && this.moduleExports.Router.prototype)
        : this.moduleExports.Router
    shimmer.unwrap(routerProto, 'use')
    shimmer.unwrap(routerProto, 'route')
    shimmer.unwrap(this.moduleExports.application, 'use')
  }

  private applyLayerPatch (layer: any, layerPath?: string) {
    const plugin = this
    if (layer[this.kPatched] === true) return
    layer[this.kPatched] = true
    plugin.logger.debug('patching express.Router.Layer.handle')
    shimmer.wrap(layer, 'handle', function (original: Function) {
      if (original.length !== 4) {
        return function (req: express.Request, res: express.Response, next: express.NextFunction) {
          // push the mounted path in the stack to be able to re-construct
          // the full route later
          plugin.safePush(req, kMiddlewareStack, layerPath)
          let spanName = `Middleware - ${layer.name}`
          if (layer.route) {
            spanName = `Route - ${layer.route.path}`
          } else if (layer.name === 'router') {
            spanName = `Router - ${layerPath}`
          }
          const span = null; //plugin.tracer.startChildSpan(spanName, SpanKind.CLIENT)
          if (span === null) return original.apply(this, arguments)
          arguments[2] = function () {
            if (!(req.route && arguments[0] instanceof Error)) {
              req[kMiddlewareStack].pop()
            }
            // end the span and call next
            return plugin.patchEnd(span, next)()
          }
          return original.apply(this, arguments)
        }
      }

      return function (_err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
        return original.apply(this, arguments)
      }
    })
  }

  private safePush (obj, prop, value) {
    if (!obj[prop]) obj[prop] = []
    obj[prop].push(value)
  }

  /**
   * Ends a created span.
   * @param span The created span to end.
   */
  private patchEnd (span: Span, callback: express.NextFunction): () => void {
    const plugin = this
    const patchedEnd = function (err?: Error): void {
      if (plugin.options.detailedCommands === true && err instanceof Error) {
        span.addAttribute('error', err.message)
      }
      if (span.ended === false) {
        span.end()
      }
      return callback.apply(this, arguments)
    }
    return this.tracer.wrap(patchedEnd)
  }
}

const plugin = new ExpressPlugin('express')
export { plugin }
