
'use strict'

import { BasePlugin, Span, SpanKind } from '@opencensus/core'
import * as shimmer from 'shimmer'
import * as semver from 'semver'

export type IgnoreMatcher= string | RegExp

export type IORedisPluginConfig = {
  /**
   * Add arguments to the span metadata for a every command
   */
  detailedCommands: boolean
}

export type IORedisCommand = {
  reject: (err: Error) => void | undefined
  resolve: (result: any) => void | undefined
  promise: Promise<any>
  args: Array<string | Buffer | number>
  callback: Function | undefined
  name: string
}

/** Redis instrumentation plugin for Opencensus */
export class IORedisPlugin extends BasePlugin {

  protected options: IORedisPluginConfig

  /** Constructs a new Redis instance. */
  constructor (moduleName: string) {
    super(moduleName)
  }

  /**
   * Patches Redis operations.
   */
  protected applyPatch () {
    this.logger.debug('Patched redis')

    if (!semver.satisfies(this.version, '>=2.0.0 <5.0.0')) {
      this.logger.info('disabling ioredis plugin because version isnt supported')
      return this.moduleExports
    }

    if (this.moduleExports) {
      this.logger.debug('patching ioredis.prototype.sendCommand')
      shimmer.wrap(this.moduleExports.prototype, 'sendCommand',
        this.getPatchSendCommand())
    }

    return this.moduleExports
  }

  /** Unpatches all Redis patched functions. */
  applyUnpatch (): void {
    if (!semver.satisfies(this.version, '>=2.0.0 <5.0.0')) return

    shimmer.unwrap(this.moduleExports.prototype, 'sendCommand')
  }

  /** Patch send command internal to trace requests */
  private getPatchSendCommand () {
    const plugin = this
    const addArguments = typeof this.options === 'object'
      && this.options.detailedCommands === true

    return function internalSendCommandWrap (original: Function) {
      return function internal_send_command_trace (command: IORedisCommand) {
        if (!plugin.tracer.currentRootSpan) {
          return original.apply(this, arguments)
        }

        const span = plugin.tracer.startChildSpan(`redis-${command.name}`, SpanKind.CLIENT)
        if (span === null) return original.apply(this, arguments)

        span.addAttribute('command', command.name)
        if (addArguments) {
          span.addAttribute('arguments', JSON.stringify(command.args))
        }

        if (typeof command.reject === 'function') {
          command.reject = plugin.tracer.wrap(command.reject)
        }
        if (typeof command.resolve === 'function') {
          command.resolve = plugin.tracer.wrap(command.resolve)
        }
        if (typeof command.callback === 'function') {
          command.callback = plugin.patchEnd(span, command.callback)
        }
        if (typeof command.promise === 'object') {
          const patchedEnd = function (err?: Error) {
            if (plugin.options.detailedCommands === true && err instanceof Error) {
              span.addAttribute('error', err.message)
            }
            // can be possible that the span is already ended
            if (span.ended === false) {
              span.end()
            }
          }
          // in node 10 or bluebird, we can attach to 'finally'
          // @ts-ignore thanks mr typescript but i know that
          if (typeof command.promise.finally === 'function') {
            // @ts-ignore thanks mr typescript but i know that
            command.promise.finally(patchedEnd)
          } else if (typeof command.promise.then === 'function') {
            command.promise.then(patchedEnd).catch(patchedEnd)
          }
        }
        return original.apply(this, arguments)
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
    const patchedEnd = function (err?: Error) {
      if (plugin.options.detailedCommands === true && err instanceof Error) {
        span.addAttribute('error', err.message)
      }
      // can be possible that the span is already ended
      if (span.ended === false) {
        span.end()
      }
      return resultHandler.apply(this, arguments)
    }
    return this.tracer.wrap(patchedEnd)
  }
}

const plugin = new IORedisPlugin('ioredis')
export { plugin }
