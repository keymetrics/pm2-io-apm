
'use strict'

import { BasePlugin, Span, SpanKind } from '@opencensus/core'
import * as shimmer from 'shimmer'
import * as semver from 'semver'

export type MqttPluginConfig = {
  /**
   * Add arguments to the span metadata for a every command
   */
  detailedCommands: boolean
}

/** Mqtt instrumentation plugin for Opencensus */
export class MqttPlugin extends BasePlugin {
  protected options: MqttPluginConfig

  /** Public method to patch for each mqtt client */
  private methods = [ 'publish', 'subscribe', 'unsubscribe' ]

  /** Constructs a new Mqtt instance. */
  constructor (moduleName: string) {
    super(moduleName)
  }

  /**
   * Patches Mqtt operations.
   */
  protected applyPatch () {
    this.logger.debug('Patched mqtt')

    if (semver.lt(this.version, '2.0.0')) {
      this.logger.info('disabling mqtt plugin because version isnt supported')
      return this.moduleExports
    }

    if (typeof this.moduleExports.connect === 'function') {
      this.logger.debug(`patching mqtt.connect`)
      shimmer.wrap(this.moduleExports, 'connect', this.getPatchCreateClient())
    }

    if (this.moduleExports.MqttClient) {
      for (let method of this.methods) {
        this.logger.debug(`patching mqtt.MqttClient.prototype.${method}`)
        shimmer.wrap(this.moduleExports.MqttClient.prototype, method,
          this.getPatchSendCommand(method))
      }
    }
    return this.moduleExports
  }

  /** Unpatches all Mqtt patched functions. */
  applyUnpatch (): void {
    if (semver.lt(this.version, '2.0.0')) return

    this.logger.debug(`unpatching mqtt.connect`)
    shimmer.unwrap(this.moduleExports, 'connect')
    for (let method of this.methods) {
      this.logger.debug(`unpatching mqtt.MqttClient.prototype.${method}`)
      shimmer.unwrap(this.moduleExports.MqttClient.prototype, method)
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
  private getPatchSendCommand (method: string) {
    const plugin = this
    const addArguments = typeof this.options === 'object'
      && this.options.detailedCommands === true
    return function internalSendCommandWrap (original: Function) {
      return function internal_send_command_trace () {
        if (!plugin.tracer.currentRootSpan) {
          return original.apply(this, arguments)
        }

        const span = plugin.tracer.startChildSpan(`mqtt-${method}`, SpanKind.CLIENT)
        if (span === null) return original.apply(this, arguments)
        switch (method) {
          case 'publish': {
            const topic = arguments[0] as string
            const msg = arguments[1] as Buffer | string
            span.addAttribute('topic', topic)
            span.addAttribute('message.length', msg.length)
            break
          }
          case 'subscribe': {
            let topic = arguments[0] as string | Array<string> | Object
            if (topic instanceof Array) {
              topic = JSON.stringify(topic)
            } else if (typeof topic === 'object') {
              topic = JSON.stringify(Object.keys(topic))
            }
            span.addAttribute('topic', `${topic}`)
            break
          }
          case 'unsubscribe': {
            let topic = arguments[0] as string | Array<string>
            if (topic instanceof Array) {
              topic = JSON.stringify(topic)
            }
            span.addAttribute('topic', `${topic}`)
            break
          }
        }

        const callback = arguments[arguments.length - 1] as (err: Error) => void
        arguments[arguments.length - 1] = plugin.patchEnd(span, callback)

        return original.apply(this, arguments)
      }
    }
  }

  /**
   * Ends a created span.
   * @param span The created span to end.
   * @param resultHandler A callback function.
   */
  patchEnd (span: Span, resultHandler?: Function): Function {
    const plugin = this
    const patchedEnd = function (err?: Error) {
      if (plugin.options.detailedCommands === true && err instanceof Error) {
        span.addAttribute('error', err.message)
      }
      if (span.ended === false) {
        span.end()
      }
      // the callback is optional
      if (typeof resultHandler === 'function') {
        return resultHandler.apply(this, arguments)
      }
    }
    return this.tracer.wrap(patchedEnd)
  }
}

const plugin = new MqttPlugin('mqtt')
export { plugin }
