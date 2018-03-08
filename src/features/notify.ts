import * as util from 'util'

import { Feature } from './featureTypes'
import { ServiceManager } from '../index'

export class NotifyOptions {
  level: string
}

export const NotifyOptionsDefault = {
  level: 'fatal'
}

export class NotifyFeature implements Feature {

  private options: NotifyOptions = NotifyOptionsDefault
  private transport
  private levels: Array<string> = ['fatal', 'error', 'warn', 'info', 'debug', 'trace']

  async init (options?: NotifyOptions): Promise<Object> {
    if (options) {
      this.options = options
    }

    this.transport = ServiceManager.get('transport')

    this.catchAll()

    return {
      notify: this.notify
    }
  }

  notify (err: Error, level?: string) {

    if (!(err instanceof Error)) {
      console.error('You should use notify with an Error !!!')
      return -1
    }

    if (!level || this.levels.indexOf(level) === -1) {
      return this.transport.send(err)
    }

    if (this.levels.indexOf(this.options.level) >= this.levels.indexOf(level)) {
      return this.transport.send(err)
    }

    return null
  }

  catchAll (opts?: any): Boolean | void {

    if (opts === undefined) {
      opts = {errors: true}
    }

    // Options.configureModule({
    //   error : opts.errors
    // });

    if (process.env.exec_mode === 'cluster_mode') {
      return false
    }

    const self = this

    function getUncaughtExceptionListener (listener) {
      return function uncaughtListener (err) {
        let error = err && err.stack ? err.stack : err

        if (err && err.length) {
          err._length = err.length
          delete err.length
        }

        if (listener === 'unhandledRejection') {
          console.log('You have triggered an unhandledRejection, you may have forgotten to catch a Promise rejection:')
        }

        console.error(error)

        let errObj
        if (err) {
          errObj = self._interpretError(err)
        }

        self.transport.send({
          type : 'process:exception',
          data : errObj !== undefined ? errObj : {message: 'No error but ' + listener + ' was caught!' }
        }, true)

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

  _jsonize (err) {
    if (typeof(err) !== 'object') {
      return err
    }

    const plainObject = {}

    Object.getOwnPropertyNames(err).forEach(function (key) {
      plainObject[key] = err[key]
    })

    return plainObject
  }

  _interpretError (err: Error | string | object) {
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

    return this._jsonize(sErr)
  }
}
