import async from 'async'
import * as inspector from 'inspector'
import JsonUtils from '../utils/json'

export interface ErrorMetadata {
  type: String,
  subtype: String,
  className: String,
  description: String,
  objectId: String,
  uncaught: Boolean
}

export default class NotifyInspector {

  static catchAllDebugger (transport): Boolean | void {

    interface TrappedException {
      error: ErrorMetadata,
      scopes: Object
    }
    const exceptionsTrapped: TrappedException[] = []
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
        const context = exceptionsTrapped.find((exception: TrappedException) => {
          return !!exception.error.description.match(error.message)
        })
        error = JsonUtils.jsonize(error)
        error.context = context ? context.scopes : undefined
        // send it
        transport.send({
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
      const error: ErrorMetadata = params.data as ErrorMetadata
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
          const result: inspector.Runtime.PropertyDescriptor[] = data.result
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
}
