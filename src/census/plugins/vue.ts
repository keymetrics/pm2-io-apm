
'use strict'

import { BasePlugin, Span, SpanKind } from '@opencensus/core'
import * as shimmer from 'shimmer'

type CreateRendererResult = {
  renderToString: Function,
  renderToStream: Function
}

enum RendererType {
  NORMAL = 'normal',
  BUNDLE = 'bundle'
}

/** vue-server-renderer instrumentation plugin for Opencensus */
export class VuePlugin extends BasePlugin {

  /**
   * We need to keep a reference to each instance of Renderer
   * to be able to unpatch them later on
   */
  private rendererResults: CreateRendererResult[] = []

  /** Constructs a new instance. */
  constructor (moduleName: string) {
    super(moduleName)
  }

  /**
   * Patches functions.
   */
  protected applyPatch () {
    this.logger.debug('Patched vue-server-renderer')

    if (this.moduleExports) {
      this.logger.debug('patching vue-server-renderer.prototype.createRenderer')
      shimmer.wrap(this.moduleExports, 'createRenderer',
        this.getPatchCreateRenderer(RendererType.NORMAL))
      this.logger.debug('patching vue-server-renderer.prototype.createBundleRenderer')
      shimmer.wrap(this.moduleExports, 'createBundleRenderer',
        this.getPatchCreateRenderer(RendererType.BUNDLE))
    }
    return this.moduleExports
  }

  /** Unpatches all patched functions. */
  applyUnpatch (): void {
    shimmer.unwrap(this.moduleExports, 'createRenderer')
    shimmer.unwrap(this.moduleExports, 'createBundleRenderer')
    for (let result of this.rendererResults) {
      shimmer.unwrap(result, 'renderToString')
    }
  }

  private getPatchCreateRenderer (type: RendererType) {
    const plugin = this
    return function createRendererWrap (original: Function) {
      return function create_renderer_trace () {
        const result = original.apply(this, arguments) as CreateRendererResult
        plugin.logger.debug(`patching ${type}.renderToString`)
        shimmer.wrap(result, 'renderToString', plugin.getPatchRenderToString(type))
        plugin.rendererResults.push(result)
        return result
      }
    }
  }

  /** Patch internal event emmitter to propagate the context */
  private getPatchRenderToString (type: RendererType) {
    const plugin = this
    return function renderToStringWrap (original: Function) {
      return function render_string_trace () {
        if (!plugin.tracer.currentRootSpan) {
          return original.apply(this, arguments)
        }
        const span = plugin.tracer.startChildSpan(`vue-renderer`, SpanKind.CLIENT)
        if (span === null) return original.apply(this, arguments)

        const promise = original.apply(this, arguments)
        if (promise instanceof Promise) {
          promise.then(plugin.patchEnd(span)).catch(plugin.patchEnd(span))
        }
        return promise
      }
    }
  }

  /**
   * Ends a created span.
   * @param span The created span to end.
   */
  patchEnd (span: Span): () => void {
    const plugin = this
    const patchedEnd = function (err?: Error): void {
      if (plugin.options.detailedCommands === true && err instanceof Error) {
        span.addAttribute('error', err.message)
      }
      if (span.ended === false) {
        span.end()
      }
    }
    return this.tracer.wrap(patchedEnd)
  }
}

const plugin = new VuePlugin('vue-server-renderer')
export { plugin }
