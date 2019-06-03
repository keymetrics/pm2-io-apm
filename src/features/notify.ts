'use strict'

import { Feature } from '../featureManager'
import Configuration from '../configuration'
import { ServiceManager } from '../serviceManager'
import Debug from 'debug'
import { Transport } from '../services/transport'
import * as semver from 'semver'
import { Cache, StackTraceParser, StackContext } from '../utils/stackParser'
import * as fs from 'fs'
import * as path from 'path'

export class NotifyOptions {
  catchExceptions: boolean
}

export class ErrorContext {
  /**
   * Add http context to your error
   */
  http?: Object
  /**
   * Add any context that you may need to debug your issue
   * example: the id of the user that made the request
   */
  custom?: Object
}

const optionsDefault: NotifyOptions = {
  catchExceptions: true
}

export class NotifyFeature implements Feature {

  private logger: Function = Debug('axm:features:notify')
  private transport: Transport | undefined
  private cache: Cache
  private stackParser: StackTraceParser

  init (options?: NotifyOptions) {
    if (options === undefined) {
      options = optionsDefault
    }
    this.logger('init')
    this.transport = ServiceManager.get('transport')
    if (this.transport === undefined) {
      return this.logger(`Failed to load transporter service`)
    }

    Configuration.configureModule({
      error : true
    })
    if (options.catchExceptions === false) return
    this.logger('Registering hook to catch unhandled exception/rejection')
    this.cache = new Cache({
      miss: (key) => {
        try {
          const content = fs.readFileSync(path.resolve(key))
          return content.toString().split(/\r?\n/)
        } catch (err) {
          this.logger('Error while trying to get file from FS : %s', err.message || err)
          return null
        }
      },
      ttl: 30 * 60
    })
    this.stackParser = new StackTraceParser({
      cache: this.cache,
      contextSize: 5
    })
    this.catchAll()
  }

  destroy () {
    process.removeListener('uncaughtException', this.onUncaughtException)
    process.removeListener('unhandledRejection', this.onUnhandledRejection)
    this.logger('destroy')
  }

  getSafeError (err): Error {
    if (err instanceof Error) return err

    let message: string
    try {
      message = `Non-error value: ${JSON.stringify(err)}`
    } catch (e) {
      // We might land here if the error value was not serializable (it might contain
      // circular references for example), or if user code was ran as part of the
      // serialization and that code threw an error.
      // As alternative, we can try converting the error to a string instead:
      try {
        message = `Unserializable non-error value: ${String(e)}`
        // Intentionally not logging the second error anywhere, because we would need
        // to protect against errors while doing *that* as well. (For example, the second
        // error's "toString" property may crash or not exist.)
      } catch (e2) {
        // That didn't work. So, report a totally unknown error that resists being converted
        // into any usable form.
        // Again, we don't even attempt to look at that third error for the same reason as
        // described above.
        message = `Unserializable non-error value that cannot be converted to a string`
      }
    }
    if (message.length > 1000) message = message.substr(0, 1000) + '...'

    return new Error(message)
  }

  notifyError (err: Error | string | {}, context?: ErrorContext) {
    // set default context
    if (typeof context !== 'object') {
      context = { }
    }

    if (this.transport === undefined) {
      return this.logger(`Tried to send error without having transporter available`)
    }

    const safeError = this.getSafeError(err)
    let stackContext: StackContext | null = null
    if (err instanceof Error) {
      stackContext = this.stackParser.retrieveContext(err)
    }

    const payload = Object.assign({
      message: safeError.message,
      stack: safeError.stack,
      name: safeError.name,
      metadata: context
    }, stackContext === null ? {} : stackContext)

    return this.transport.send('process:exception', payload)
  }

  private onUncaughtException (error) {
    if (semver.satisfies(process.version, '< 6')) {
      console.error(error.stack)
    } else {
      console.error(error)
    }

    const safeError = this.getSafeError(error)
    let stackContext: StackContext | null = null
    if (error instanceof Error) {
      stackContext = this.stackParser.retrieveContext(error)
    }

    const payload = Object.assign({
      message: safeError.message,
      stack: safeError.stack,
      name: safeError.name
    }, stackContext === null ? {} : stackContext)

    if (ServiceManager.get('transport')) {
      ServiceManager.get('transport').send('process:exception', payload)
    }
    if (process.listeners('uncaughtException').length === 1) { // if it's only us, exit
      process.exit(1)
    }
  }

  private onUnhandledRejection (error) {
    // see  https://github.com/keymetrics/pm2-io-apm/issues/223
    if (error === undefined) return

    console.error(error)

    const safeError = this.getSafeError(error)
    let stackContext: StackContext | null = null
    if (error instanceof Error) {
      stackContext = this.stackParser.retrieveContext(error)
    }

    const payload = Object.assign({
      message: safeError.message,
      stack: safeError.stack,
      name: safeError.name
    }, stackContext === null ? {} : stackContext)

    if (ServiceManager.get('transport')) {
      ServiceManager.get('transport').send('process:exception', payload)
    }
  }

  private catchAll (): Boolean | void {
    if (process.env.exec_mode === 'cluster_mode') {
      return false
    }

    process.on('uncaughtException', this.onUncaughtException.bind(this))
    process.on('unhandledRejection', this.onUnhandledRejection.bind(this))
  }

  expressErrorHandler () {
    const self = this
    Configuration.configureModule({
      error : true
    })
    return function errorHandler (err, req, res, next) {
      const safeError = self.getSafeError(err)
      const payload = {
        message: safeError.message,
        stack: safeError.stack,
        name: safeError.name,
        metadata: {
          http: {
            url: req.url,
            params: req.params,
            method: req.method,
            query: req.query,
            body: req.body,
            path: req.path,
            route: req.route && req.route.path ? req.route.path : undefined
          },
          custom: {
            user: typeof req.user === 'object' ? req.user.id : undefined
          }
        }
      }

      if (ServiceManager.get('transport')) {
        ServiceManager.get('transport').send('process:exception', payload)
      }
      return next(err)
    }
  }

  koaErrorHandler () {
    const self = this
    Configuration.configureModule({
      error : true
    })
    return async function (ctx, next) {
      try {
        await next()
      } catch (err) {
        const safeError = self.getSafeError(err)
        const payload = {
          message: safeError.message,
          stack: safeError.stack,
          name: safeError.name,
          metadata: {
            http: {
              url: ctx.request.url,
              params: ctx.params,
              method: ctx.request.method,
              query: ctx.request.query,
              body: ctx.request.body,
              path: ctx.request.path,
              route: ctx._matchedRoute
            },
            custom: {
              user: typeof ctx.user === 'object' ? ctx.user.id : undefined
            }
          }
        }
        if (ServiceManager.get('transport')) {
          ServiceManager.get('transport').send('process:exception', payload)
        }
        throw err
      }
    }
  }
}
