
'use strict'

import { BasePlugin, Span, SpanKind } from '@opencensus/core'
import * as shimmer from 'shimmer'
import * as semver from 'semver'
import * as redis from 'redis'

export type Redis = typeof redis

export type IgnoreMatcher= string | RegExp

export type RedisPluginConfig = {
  /**
   * Add arguments to the span metadata for a every command
   */
  detailedCommands: boolean
}

/** Redis instrumentation plugin for Opencensus */
export class RedisPlugin extends BasePlugin {
  protected options: RedisPluginConfig

  /** Constructs a new Redis instance. */
  constructor (moduleName: string) {
    super(moduleName)
  }

  /**
   * Patches Redis operations.
   */
  protected applyPatch () {
    this.logger.debug('Patched redis')

    if (semver.lt(this.version, '2.4.0')) {
      this.logger.info('disabling redis plugin because version isnt supported')
      return this.moduleExports
    }

    if (this.moduleExports.RedisClient) {
      this.logger.debug('patching redis.RedisClient.prototype.create_stream')
      shimmer.wrap(this.moduleExports.RedisClient.prototype, 'create_stream',
        this.getPatchCreateStream())
      this.logger.debug('patching redis.RedisClient.prototype.internal_send')
      shimmer.wrap(this.moduleExports.RedisClient.prototype, 'internal_send_command',
        this.getPatchSendCommand())
      this.logger.debug('patching redis.RedisClient.prototype.createClient')
      shimmer.wrap(this.moduleExports, 'createClient', this.getPatchCreateClient())
    }
    return this.moduleExports
  }

  /** Unpatches all Redis patched functions. */
  applyUnpatch (): void {
    if (semver.lt(this.version, '2.4.0')) return

    shimmer.unwrap(this.moduleExports.RedisClient.prototype, 'internal_send_command')
    shimmer.unwrap(this.moduleExports, 'createClient')
    shimmer.unwrap(this.moduleExports.RedisClient.prototype, 'create_stream')
  }

  /** Patch internal event emmitter to propagate the context */
  private getPatchCreateStream () {
    const plugin = this
    return function createStreamWrap (original: Function) {
      return function create_stream_trace () {
        if (!this.stream) {
          Object.defineProperty(this, 'stream', {
            get: function () { return this._patched_redis_stream },
            set: function (val) {
              plugin.tracer.wrapEmitter(val)
              this._patched_redis_stream = val
            }
          })
        }
        return original.apply(this, arguments)
      }
    }
  }

  /** Patch client event emmitter to propagate the context */
  private getPatchCreateClient () {
    const plugin = this
    return function createClientWrap (original: Function) {
      return function createClientTrace () {
        const client = original.apply(this, arguments)
        plugin.tracer.wrapEmitter(client)
        return client
      }
    }
  }

  /** Patch send command internal to trace requests */
  private getPatchSendCommand () {
    const plugin = this
    const addArguments = typeof this.options === 'object'
      && this.options.detailedCommands === true
    return function internalSendCommandWrap (original: Function) {
      return function internal_send_command_trace (cmd, args, cb) {
        if (!plugin.tracer.currentRootSpan) {
          return original.apply(this, arguments)
        }
        // New versions of redis (2.4+) use a single options object instead
        // of separate named arguments.
        if (arguments.length === 1 && typeof cmd === 'object') {
          const span = plugin.tracer.startChildSpan(`redis-${cmd.command}`, SpanKind.CLIENT)
          if (span === null) return original.apply(this, arguments)

          span.addAttribute('command', cmd.command)
          if (addArguments) {
            span.addAttribute('arguments', JSON.stringify(cmd.args || []))
          }
          cmd.callback = plugin.patchEnd(span, cmd.callback)
          return original.apply(this, arguments)
        }
        // older commands where using multiple arguments, focus on supporting
        if (typeof cmd === 'string' && Array.isArray(args) && typeof cb === 'function') {
          const span = plugin.tracer.startChildSpan(`redis-${cmd}`, SpanKind.CLIENT)
          if (span === null) return original.apply(this, arguments)

          span.addAttribute('command', cmd)
          if (addArguments) {
            span.addAttribute('arguments', JSON.stringify(args))
          }
          cb = plugin.patchEnd(span, cb)
          return original.apply(this, arguments)
        }
        // if the action aren't in any of the above format, don't trace them
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
      if (span.ended === false) {
        span.end()
      }
      // it's possible that the redis cmd doesnt have any callback
      // since we are adding it ourselves, the original callback might
      // not exist
      if (typeof resultHandler === 'function') {
        return resultHandler.apply(this, arguments)
      }
    }
    return this.tracer.wrap(patchedEnd)
  }
}

const plugin = new RedisPlugin('redis')
export { plugin }
