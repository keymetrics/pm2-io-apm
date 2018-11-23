import { ServiceManager } from '../serviceManager'
import { Transport } from './transport'
import * as Debug from 'debug'
import * as cluster from 'cluster'
import * as EventLoopInspector from 'event-loop-inspector'

export class Action {
  handler: Function
  name: string
  type: string
  isScoped: boolean
  callback?: Function
  arity: number
  opts: Object | null | undefined
}

export default class ActionService {

  private timer
  private listenerInitiated: Boolean = false
  private transport: Transport
  private actions: Map<string, Action>
  private logger: any
  private eventLoopInspector = EventLoopInspector()

  constructor () {
    const autoExit = cluster.isWorker === true
    this.transport = ServiceManager.get('transport')
    this.logger = Debug('axm:services:actions')

    if (!autoExit) return

    // clean listener if event loop is empty
    // important to ensure apm will not prevent application to stop
    this.timer = setInterval(() => {
      const dump = this.eventLoopInspector.dump()

      if (!dump || (dump.setImmediates.length === 0 &&
          dump.nextTicks.length === 0 &&
          (Object.keys(dump.handles).length === 0 || (Object.keys(dump.handles).length === 1 &&
            dump.handles.hasOwnProperty('Socket') &&
            dump.handles.Socket.length === 2 &&
            (dump.handles.Socket[0].fd === 1 ||
              dump.handles.Socket[0].fd === -1) &&
            (dump.handles.Socket[1].fd === 2 ||
              dump.handles.Socket[1].fd === -1))) &&
          Object.keys(dump.requests).length === 0)) {
        process.removeListener('message', this.listener)
      }
    }, 1000)

    this.timer.unref()
  }

  private listener (data) {
    if (!data) return false

    const actionName = data.msg ? data.msg : data.action_name ? data.action_name : data
    let action = this.actions.get(actionName)
    if (typeof action !== 'object') {
      return this.logger(`Received action ${actionName} but failed to find the implementation`)
    }

    // handle normal custom action
    if (!action.isScoped) {
      this.logger(`Succesfully called custom action ${action.name} with arity ${action.handler.length}`)
      // In case 2 arguments has been set but no options has been transmitted
      if (action.handler.length === 2) {
        let params = {}
        if (typeof data === 'object') {
          params = data.opts
        }
        return action.handler(params, action.callback)
      }
      return action.handler(action.callback)
    }

    // handle scoped actions
    if (data.uuid === undefined) {
      return this.logger(`Received scoped action ${action.name} but without uuid`)
    }

    // create a simple object that represent a stream
    const stream = {
      send : (dt) => {
        this.transport.send('axm:scoped_action:stream', {
          data: dt,
          uuid: data.uuid,
          action_name: actionName
        })
      },
      error : (dt) => {
        this.transport.send('axm:scoped_action:error', {
          data: dt,
          uuid: data.uuid,
          action_name: actionName
        })
      },
      end : (dt) => {
        this.transport.send('axm:scoped_action:end', {
          data: dt,
          uuid: data.uuid,
          action_name: actionName
        })
      }
    }

    this.logger(`Succesfully called scoped action ${action.name}`)
    return action.handler(data.opts || {}, stream)
  }

  init (): void {
    // be sure to never listen twince the message
    if (this.listenerInitiated === true) return
    this.listenerInitiated = true
    this.transport.on('*', this.listener)
  }

  destroy (): void {
    clearInterval(this.timer)
  }

  /**
   * Register a custom action that will be called when we receive a call for this actionName
   */
  registerAction (actionName?: string, opts?: Object | undefined | Function, handler?: Function): void {
    if (typeof opts === 'function') {
      handler = opts
      opts = undefined
    }

    if (typeof actionName !== 'string') {
      console.error(`You must define an name when registering an action`)
      return
    }
    if (typeof handler !== 'function') {
      console.error(`You must define an callback when registering an action`)
      return
    }

    let type = 'custom'

    if (actionName.indexOf('km:') === 0 || actionName.indexOf('internal:') === 0) {
      type = 'internal'
    }

    const reply = (data) => {
      this.transport.send('axm:reply', {
        at: new Date().getTime(),
        action_name: actionName,
        return: data
      })
    }

    const action: Action = {
      name: actionName,
      callback: reply,
      handler,
      type,
      isScoped: false,
      arity: handler.length,
      opts
    }
    this.logger(`Succesfully registered custom action ${action.name}`)
    this.actions.set(actionName, action)
    this.transport.addAction(action)
  }

  /**
   * Register a scoped action that will be called when we receive a call for this actionName
   */
  scopedAction (actionName?: string, handler?: Function) {
    if (typeof actionName !== 'string') {
      console.error(`You must define an name when registering an action`)
      return -1
    }
    if (typeof handler !== 'function') {
      console.error(`You must define an callback when registering an action`)
      return -1
    }

    const action: Action = {
      name: actionName,
      handler,
      type: 'scoped',
      isScoped: true,
      arity: handler.length,
      opts: null
    }
    this.logger(`Succesfully registered scoped action ${action.name}`)
    this.actions.set(actionName, action)
    this.transport.addAction(action)
  }
}
