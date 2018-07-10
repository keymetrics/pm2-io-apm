import * as domain from 'domain'
import Debug from 'debug'
const debug = Debug('axm:actions')
import { ServiceManager } from '../serviceManager'
import Transport from '../utils/transport'
import { Feature } from './featureTypes'
import ActionsService from '../services/actions'

export default class ActionsFeature implements Feature {

  private actionsService: ActionsService
  private firstAction: boolean = true

  constructor () {
    ServiceManager.set('actionsService', new ActionsService(this))
    this.actionsService = ServiceManager.get('actionsService')
  }

  listener (data) {
    if (!data) return false

    const actionName = data.msg ? data.msg : data.action_name ? data.action_name : data
    let actionData = ServiceManager.get('actions').get(actionName)
    let fn = actionData ? actionData.fn : null
    const reply = actionData ? actionData.reply : null

    if (actionData) {
      // In case 2 arguments has been set but no options has been transmitted
      if (fn.length === 2 && typeof(data) === 'string' && data === actionName) {
        return fn({}, reply)
      }

      // In case 1 arguments has been set but options has been transmitted
      if (fn.length === 1 && typeof(data) === 'object' && data.msg === actionName) {
        return fn(reply)
      }

      /**
       * Classical call
       */
      if (typeof(data) === 'string' && data === actionName) {
        return fn(reply)
      }

      /**
       * If data is an object == v2 protocol
       * Pass the opts as first argument
       */
      if (typeof(data) === 'object' && data.msg === actionName) {
        return fn(data.opts, reply)
      }
    }

    // -----------------------------------------------------------
    //                      Scoped actions
    // -----------------------------------------------------------
    if (data.uuid === undefined || data.action_name === undefined) {
      return false
    }

    actionData = ServiceManager.get('actionsScoped').get(actionName)

    if (data.action_name === actionName) {
      const res = {
        send : (dt) => {
          Transport.send({
            type        : 'axm:scoped_action:stream',
            data        : {
              data        : dt,
              uuid        : data.uuid,
              action_name : actionName
            }
          })
        },
        error : (dt) => {
          Transport.send({
            type        : 'axm:scoped_action:error',
            data        : {
              data        : dt,
              uuid        : data.uuid,
              action_name : actionName
            }
          })
        },
        end : (dt) => {
          Transport.send({
            type        : 'axm:scoped_action:end',
            data        : {
              data        : dt,
              uuid        : data.uuid,
              action_name : actionName
            }
          })
        }
      }

      const d = domain.create()

      d.on('error', function (err) {
        res.error(err.message || err.stack || err)
        setTimeout(function () {
          process.exit(1)
        }, 300)
      })

      d.run(function () {
        actionData.fn(data.opts || null, res)
      })
    }
  }

  init (conf?, force?): Object {

    this.actionsService.init(conf, force)

    return {
      action: this.action
    }
  }

  destroy (): void {
    this.actionsService.destroy()
    ServiceManager.reset('actions')
    ServiceManager.reset('actionsScoped')
    process.removeListener('message', this.listener)
  }

  action (actionName, opts?, fn?) {
    if (!fn) {
      fn = opts
      opts = null
    }

    const check = this.check(actionName, fn)
    if (!check) {
      return check
    }

    if (this.firstAction) {
      this.firstAction = false
      process.on('message', this.listener)
    }

    let type = 'custom'

    if (actionName.indexOf('km:') === 0 || actionName.indexOf('internal:') === 0) {
      type = 'internal'
    }

    // Notify the action
    Transport.send({
      type : 'axm:action',
      data : {
        action_name : actionName,
        action_type : type,
        opts        : opts,
        arity       : fn.length
      }
    })

    const reply = (data) => {
      Transport.send({
        type        : 'axm:reply',
        data        : {
          return      : data,
          action_name : actionName
        }
      })
    }

    ServiceManager.get('actions').set(actionName, { fn: fn, reply: reply })
  }

  scopedAction (actionName, fn) {

    const check = this.check(actionName, fn)
    if (!check) {
      return check
    }

    if (this.firstAction) {
      this.firstAction = false
      process.on('message', this.listener)
    }

    // Notify the action
    Transport.send({
      type : 'axm:action',
      data : {
        action_name : actionName,
        action_type : 'scoped'
      }
    })

    ServiceManager.get('actionsScoped').set(actionName, { fn: fn })
  }

  private check (actionName, fn) {
    if (!actionName) {
      console.error('[PMX] action.action_name is missing')
      return false
    }
    if (!fn) {
      console.error('[PMX] callback is missing')
      return false
    }

    if (!process.send) {
      debug('Process not running within PM2')
      return false
    }

    return true
  }
}
