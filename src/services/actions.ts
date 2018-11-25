import { ServiceManager } from '../serviceManager'
import { Transport } from './transport'
import * as Debug from 'debug'

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

  private timer: NodeJS.Timer | null = null
  private listenerInitiated: Boolean = false
  private transport: Transport | null = null
  private actions: Map<string, Action> = new Map<string, Action>()
  private logger: Function = Debug('axm:services:actions')

  private listener (data) {
    this.logger(`Received new message from reverse`)
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

    if (this.transport === undefined || this.transport === null) {
      return this.logger(`Failed to load transport service`)
    }

    // create a simple object that represent a stream
    const stream = {
      send : (dt) => {
        // @ts-ignore thanks mr typescript but i already checked above
        this.transport.send('axm:scoped_action:stream', {
          data: dt,
          uuid: data.uuid,
          action_name: actionName
        })
      },
      error : (dt) => {
        // @ts-ignore thanks mr typescript but i already checked above
        this.transport.send('axm:scoped_action:error', {
          data: dt,
          uuid: data.uuid,
          action_name: actionName
        })
      },
      end : (dt) => {
        // @ts-ignore thanks mr typescript but i already checked above
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
    this.transport = ServiceManager.get('transport')
    if (this.transport === undefined || this.transport === null) {
      return this.logger(`Failed to load transport service`)
    }
    this.actions.clear()
    // be sure to never listen twince the message
    if (this.listenerInitiated === true) return
    this.listenerInitiated = true
    this.transport.on('data', this.listener.bind(this))
  }

  destroy (): void {
    if (this.timer !== null) {
      clearInterval(this.timer)
    }
    if (this.transport !== null && this.transport !== undefined) {
      this.transport.removeListener('data', this.listener.bind(this))
    }
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
    if (this.transport === undefined || this.transport === null) {
      return this.logger(`Failed to load transport service`)
    }

    let type = 'custom'

    if (actionName.indexOf('km:') === 0 || actionName.indexOf('internal:') === 0) {
      type = 'internal'
    }

    const reply = (data) => {
      // @ts-ignore thanks mr typescript but i already checked above
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
    if (this.transport === undefined || this.transport === null) {
      return this.logger(`Failed to load transport service`)
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
