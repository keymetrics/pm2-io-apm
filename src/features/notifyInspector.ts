import async from 'async'
import * as inspector from 'inspector'
import JsonUtils from '../utils/json'
import { ServiceManager } from '../serviceManager'
import Transport from '../utils/transport'
import { InspectorService } from '../services/inspector'

export interface ErrorMetadata {
  type: String,
  subtype: String,
  className: String,
  description: String,
  objectId: String,
  uncaught: Boolean
}

export interface ScopeMetadata extends inspector.Debugger.Scope {
  context: PropertyMetadata[]
}

export interface PropertyMetadata {
  properties?: PropertyMetadata[]
  name: string
  value?: inspector.Runtime.RemoteObject
  writable?: boolean
  get?: inspector.Runtime.RemoteObject
  set?: inspector.Runtime.RemoteObject
  configurable?: boolean
  enumerable?: boolean
  wasThrown?: boolean
  isOwn?: boolean
  symbol?: inspector.Runtime.RemoteObject
}

export interface TrappedException {
  error: ErrorMetadata,
  frame: Object,
  asyncStackTrace?: inspector.Runtime.StackTrace
}

export interface FetchObjectPropertiesReturnType {
  (err?: Error, data?: PropertyMetadata[]): void
}

export default class NotifyInspector {

  private inspectorService: InspectorService
  private exceptionsTrapped: TrappedException[]

  constructor () {
    this.inspectorService = ServiceManager.get('inspector')
    this.exceptionsTrapped = []
  }

  init () {
    this.inspectorService.createSession()
    this.inspectorService.connect()
    this.catchAllDebugger()
  }

  destroy () {
    this.inspectorService.disconnect()
  }

  trapException (listener: String) {
    return (error) => {
      // log it
      if (listener === 'unhandledRejection') {
        console.log('You have triggered an unhandledRejection, you may have forgotten to catch a Promise rejection:')
      }
      console.error(error)
      // create object to be send
      const context = this.exceptionsTrapped.find((exception: TrappedException) => {
        return !!exception.error.description.match(error.message)
      })
      error = JsonUtils.jsonize(error)

      // inject async stackframe
      if (context && context.asyncStackTrace) {
        const fetchFrames = (entry: inspector.Runtime.StackTrace): inspector.Runtime.CallFrame[] => {
          return entry.parent ? entry.callFrames.concat(fetchFrames(entry.parent)) : entry.callFrames
        }
        const asyncStack: String[] = fetchFrames(context.asyncStackTrace)
          .filter(frame => frame.url.indexOf('internal') === -1)
          .map(frame => {
            return `    at ${frame.functionName || '<anonymous>'} (${frame.url}:${frame.lineNumber}:${frame.columnNumber})`
          })
        asyncStack.unshift('')
        error.stack = error.stack.concat(asyncStack.join('\n'))
      }
      error.frame = context ? context.frame : undefined
      // send it
      Transport.send({
        type: 'process:exception',
        data: error
      })
      // at this point the process should exit
      process.exit(1)
    }
  }

  isObjectInteresting (entry: PropertyMetadata): Boolean {
    if (!entry.value) return false
    if (!entry.value.objectId) return false
    if (entry.value.type !== 'object') return false

    switch (entry.value.description) {
      case 'IncomingMessage': {
        return true
      }
    }

    switch (entry.name) {
      case 'headers': {
        return true
      }
      case 'user': {
        return true
      }
      case 'token': {
        return true
      }
      case 'body': {
        return true
      }
      case 'params': {
        return true
      }
      case 'query': {
        return true
      }
    }

    return false
  }

  isPropertyIntesting (entry: PropertyMetadata, parent?: PropertyMetadata): Boolean {
    if (!entry.value) return false
    if (entry.value.type === 'object' && entry.properties) return true
    if (parent && parent.name === 'headers') return true
    if (parent && parent.name === 'body') return true
    if (parent && parent.name === 'params') return true
    if (parent && parent.name === 'query') return true
    if (entry.name === '__proto__') return false

    switch (entry.name) {
      case 'url': {
        return true
      }
      case 'user': {
        return true
      }
      case 'token': {
        return true
      }
      case 'method': {
        return true
      }
      case 'ip': {
        return true
      }
      case 'query': {
        return true
      }
      case 'path': {
        return true
      }
      case 'body': {
        return true
      }
      case 'params': {
        return true
      }
    }

    return false
  }

  formatProperty (property: PropertyMetadata) {
    const value = property.value && property.value.value ? property.value.value : null
    const description = property.value && property.value.description ? property.value.description : null
    return {
      name: property.name,
      value: value || description || property.value,
      properties: property.properties
    }
  }

  fetchObjectProperties (session: inspector.Session, object: String, cb: FetchObjectPropertiesReturnType) {
    session.post('Runtime.getProperties', {
      objectId: object,
      ownProperties: true
    }, (err, data: inspector.Runtime.GetPropertiesReturnType) => {
      if (err) return cb(err, undefined)
      async.map(data.result, (entry: PropertyMetadata, next) => {
        if (entry.value && entry.value.objectId && this.isObjectInteresting(entry)) {
          return this.fetchObjectProperties(session, entry.value.objectId, (err, properties) => {
            if (err) return next(err)

            // if some properties has been dumped, attach them
            if (properties) {
              entry.properties = properties
                .filter(property => {
                  return this.isPropertyIntesting(property, entry)
                })
                .map(this.formatProperty)
            }

            return next(undefined, this.formatProperty(entry))
          })
        } else {
          return next(undefined, this.formatProperty(entry))
        }
      }, cb)
    })
  }

  catchAllDebugger (): Boolean | void {
    const session: inspector.Session = this.inspectorService.createSession()
    this.inspectorService.connect()
    // trap exception so we can re-use them with the debugger
    process.on('uncaughtException', this.trapException('uncaughtException'))
    process.on('unhandledRejection', this.trapException('unhandledRejection'))
    // enable all the debugger options
    session.post('Debugger.enable')
    const maxDepth = parseInt(process.env.PM2_APM_ASYNC_STACK_DEPTH || '')
    if (!isNaN(maxDepth)) {
      session.post('Debugger.setAsyncCallStackDepth', { maxDepth })
    }
    
    session.post('Debugger.setPauseOnExceptions', { state: 'uncaught' })
    // register handler for paused event
    session.on('Debugger.paused', ({ params }) => {
      // should not happen but anyway
      if (params.reason !== 'exception' && params.reason !== 'promiseRejection') {
        return session.post('Debugger.resume')
      }
      if (!params.data) return session.post('Debugger.resume')
      const error: ErrorMetadata = params.data as ErrorMetadata

      // get only the current frame
      const frame: inspector.Debugger.CallFrame = params.callFrames[0]

      // on each frame, dump all scopes
      async.map(frame.scopeChain, (scope: inspector.Debugger.Scope, nextScope) => {
        if (scope.type === 'global') return nextScope()
        if (!scope.object.objectId) return nextScope()
        // get context of the scope
        return this.fetchObjectProperties(session, scope.object.objectId, (error, context) => {
          return nextScope(error, Object.assign(scope, {
            context,
            object: undefined
          }))
        })
      }, (err: Error, scopes: ScopeMetadata[]) => {
        if (err) {
          console.error(err)
          return session.post('Debugger.resume')
        }

        // we can remove some scope so we want to remove null entry
        scopes = scopes.filter(scope => !!scope)

        // inspect each scope to retrieve his context
        this.exceptionsTrapped.push({
          error,
          asyncStackTrace: params.asyncStackTrace,
          frame: Object.assign(frame, {
            scopeChain: scopes
          })
        })
        // continue execution
        return session.post('Debugger.resume')
      })
    })
  }
}
