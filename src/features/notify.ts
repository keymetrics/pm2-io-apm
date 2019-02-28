'use strict'

import { Feature } from '../featureManager'
import Configuration from '../configuration'
import { ServiceManager } from '../serviceManager'
import Debug from 'debug'
import { Transport } from '../services/transport'
import * as semver from 'semver'

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
    this.catchAll()
  }

  destroy () {
    process.removeListener('uncaughtException', this.onUncaughtException)
    process.removeListener('unhandledRejection', this.onUnhandledRejection)
    this.logger('destroy')
  }

  notifyError (err: Error, context?: ErrorContext) {
    // set default context
    if (typeof context !== 'object') {
      context = { }
    }

    if (!(err instanceof Error)) {
      console.error('You must use notifyError with an Error object, ignoring')
      console.trace()
      return -1
    }

    if (this.transport === undefined) {
      return this.logger(`Tried to send error without having transporter available`)
    }

    const payload = {
      message: err.message,
      stack: err.stack,
      name: err.name,
      metadata: context
    }

    return this.transport.send('process:exception', payload)
  }

  private onUncaughtException (error) {
    if (semver.satisfies(process.version, '< 6')) {
      console.error(error.stack)
    } else {
      console.error(error)
    }

    const safeError = error instanceof Error ? error : new Error(JSON.stringify(error))

    const payload = {
      message: safeError.message,
      stack: safeError.stack,
      name: safeError.name
    }

    if (ServiceManager.get('transport')) {
      ServiceManager.get('transport').send('process:exception', payload)
    }
    process.exit(1)
  }

  private onUnhandledRejection (error) {
    // see  https://github.com/keymetrics/pm2-io-apm/issues/223
    if (error === undefined) return

    console.error(error)

    const safeError = error instanceof Error ? error : new Error(JSON.stringify(error))

    const payload = {
      message: safeError.message,
      stack: safeError.stack,
      name: safeError.name
    }

    if (ServiceManager.get('transport')) {
      ServiceManager.get('transport').send('process:exception', payload)
    }
  }

  private catchAll (): Boolean | void {
    if (process.env.exec_mode === 'cluster_mode') {
      return false
    }

    process.on('uncaughtException', this.onUncaughtException)
    process.on('unhandledRejection', this.onUnhandledRejection)
  }

  expressErrorHandler () {
    Configuration.configureModule({
      error : true
    })
    return function errorHandler (err, req, res, next) {
      const safeError = err instanceof Error ? err : new Error(JSON.stringify(err))
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
    Configuration.configureModule({
      error : true
    })
    return async function (ctx, next) {
      try {
        await next()
      } catch (err) {
        const safeError = err instanceof Error ? err : new Error(JSON.stringify(err))
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
      }
    }
  }
}
