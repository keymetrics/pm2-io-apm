import * as util from 'util'
import { Feature } from '../featureManager'
import Configuration from '../configuration'
import { ServiceManager } from '../serviceManager'
import Debug from 'debug'
import { Transport } from '../services/transport'

export class NotifyOptions {
  catchExceptions: boolean
}

export class ErrorContext {
  http?: Object
  custom?: Object
  level?: string
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

  private catchAll (opts?: any): Boolean | void {
    if (opts === undefined) {
      opts = { errors: true }
    }

    if (process.env.exec_mode === 'cluster_mode') {
      return false
    }

    const self = this

    function getUncaughtExceptionListener (listener) {
      return function uncaughtListener (err) {
        let error = err && err.stack ? err.stack : err

        if (listener === 'unhandledRejection') {
          console.log('You have triggered an unhandledRejection, you may have forgotten to catch a Promise rejection:')
        }

        console.error(error)

        let errObj
        if (err) {
          errObj = self._interpretError(err)
        }

        if (ServiceManager.get('transport')) {
          ServiceManager.get('transport').send('process:exception', errObj !== undefined ? errObj : { message: 'No error but ' + listener + ' was caught!' })
        }

        if (!process.listeners(listener).filter(function (listener) {
          return listener !== uncaughtListener
        }).length) {

          if (listener === 'uncaughtException') {
            process.exit(1)
          }
        }
      }
    }

    if (opts.errors === true && util.inspect(process.listeners('uncaughtException')).length === 2) {
      process.once('uncaughtException', getUncaughtExceptionListener('uncaughtException'))
      process.once('unhandledRejection', getUncaughtExceptionListener('unhandledRejection'))
    } else if (opts.errors === false
      && util.inspect(process.listeners('uncaughtException')).length !== 2) {
      process.removeAllListeners('uncaughtException')
      process.removeAllListeners('unhandledRejection')
    }
  }

  expressErrorHandler () {
    Configuration.configureModule({
      error : true
    })

    return function errorHandler (err, req, res, next) {
      const payload = {
        message: err.message,
        stack: err.stack,
        name: err.name,
        metadata: {
          http: {
            url: req.url,
            params: req.params,
            method: req.method,
            body: req.body,
            session: req.session,
            path: req.path,
            route: req.route && req.route.path ? req.route.path : undefined
          }
        }
      }

      if (ServiceManager.get('transport')) {
        ServiceManager.get('transport').send('process:exception', payload)
      }
      return next(err)
    }
  }

  private _interpretError (err: Error | string | object) {
    let sErr: any = {
      message: null,
      stack: null
    }

    if (err instanceof Error) {
      // Error object type processing
      sErr = err
    } else {
      // JSON processing
      sErr.message = err
      sErr.stack = err
    }

    return this.jsonize(sErr)
  }

  private jsonize (obj: Object) {
    return JSON.parse(JSON.stringify(obj))
  }
}
