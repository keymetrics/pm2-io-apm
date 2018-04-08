import * as util from 'util'

import { Feature } from './featureTypes'
import { ServiceManager } from '../index'
import * as inspector from 'inspector'
import async from 'async'


export class NotifyOptions {
  level: string
}

export const NotifyOptionsDefault = {
  level: 'fatal'
}

export interface errorMetadata {
  type: String,
  subtype: String,
  className: String,
  description: String,
  objectId: String,
  uncaught: Boolean
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

    if (process.env.CATCH_CONTEXT_ON_ERROR === 'true') {
      this._catchAllDebugger()
    } else {
      this.catchAll()
    }

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

  _catchAllDebugger () : Boolean | void {
    interface trappedException {
      error: errorMetadata,
      scopes: Object
    }
    const exceptionsTrapped : trappedException[] = []
    const session = new inspector.Session()
    session.connect()

    // trap exception so we can re-use them with the debugger
    const trapException = listener => {
      return (error) => {
        // log it
        if (listener === 'unhandledRejection') {
          console.log('You have triggered an unhandledRejection, you may have forgotten to catch a Promise rejection:')
        }
        console.error(error)
        // create object to be send
        const context = exceptionsTrapped.find((exception: trappedException) => {
          return !!exception.error.description.match(error.message)
        })
        error = this._jsonize(error)
        error.context = context ? context.scopes : undefined
        // send it
        this.transport.send({
          type: 'process:exception',
          data: error
        }, true)
        // at this point the process should exit
        process.exit(1)
      }
    }
    process.on('uncaughtException', trapException('uncaughtException'))
    process.on('unhandledRejection', trapException('unhandledRejection'))

    session.post('Debugger.enable')

    session.post('Debugger.setPauseOnExceptions', { state: 'uncaught' })
    session.on('Debugger.paused', ({ params }) => {
      // should not happen but anyway
      if (params.reason !== 'exception' && params.reason !== 'promiseRejection') {
        return session.post('Debugger.resume')
      }
      if (!params.data) return session.post('Debugger.resume')
      const error: errorMetadata = params.data as errorMetadata
      // only the current frame is interesting us
      const frame = params.callFrames[0]
      // inspect each scope to retrieve his context
      async.map(frame.scopeChain, (scope: inspector.Debugger.Scope, next) => {
        if (scope.type === 'global') return next()
        // get context of the scope
        session.post('Runtime.getProperties', {
          objectId: scope.object.objectId,
          ownProperties: true
        }, (err, data: inspector.Runtime.GetPropertiesReturnType) => {
          const result : inspector.Runtime.PropertyDescriptor[] = data.result
          return next(err, {
            scope: scope.type,
            name: scope.name,
            startLocation: scope.startLocation,
            endLocation: scope.endLocation,
            context: result.map((entry: inspector.Runtime.PropertyDescriptor) => {
              if (!entry.value) return {}
              return {
                name: entry.name,
                type: entry.value.type,
                value: entry.value.value ? entry.value.value : entry.value.description
              }
            })
          })
        })
      }, (err: Error, scopes: inspector.Debugger.Scope[]) => {
        if (err) return console.error(err)

        // we can remove some scope so we want to remove null entry
        scopes = scopes.filter(scope => !!scope)

        // okay so we want to get all of the script to attach it to the error
        const scriptIds = scopes.map((scope: inspector.Debugger.Scope) => {
          return scope.startLocation ? scope.startLocation.scriptId : null
        }).filter(scriptId => !!scriptId)

        async.map(scriptIds, (scriptId: String, next) => {
          session.post('Debugger.getScriptSource', {
            scriptId
          }, (err, data: inspector.Debugger.GetScriptSourceReturnType) => {
            return next(err, { id: scriptId, source: data.scriptSource })
          })
        }, (err, scripts) => {
          if (err) return console.error(err)
          // so now we want only to attach the script source that match each scope
          
          async.map(scopes, (scope: inspector.Debugger.Scope, next) => {
            if (!scope.startLocation || !scope.endLocation) return next()
            // get the script for this scope
            let script = scripts.find(script => {
              if (!scope.startLocation) return false
              return script.id === scope.startLocation.scriptId
            })
            script = script.source.split('\n')
            // dont attach the whole script of the closure of the file
            if (scope.startLocation.lineNumber === 0 && scope.endLocation.lineNumber + 1 === script.length) {
              return next(null, { scope })
            }
            // remove the part before the scope
            script.splice(0, scope.startLocation.lineNumber)
            // remove the part after the scope
            script.splice(scope.endLocation.lineNumber + 1, script.length - 1)
            // then we can attach the source to the scope
            return next(null, {
              source: script,
              scope
            })
          }, (err, scopes) => {
            if (err) return console.error(err)
  
            exceptionsTrapped.push({ error, scopes })
            // continue execution
            return session.post('Debugger.resume')
          })
        })
      })
    })
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
