'use strict'

import Debug from 'debug'
import utils from '../utils/module'
import { EventEmitter2 } from 'eventemitter2'

export class RuntimeStatsService extends EventEmitter2 {

  private logger: any = Debug('axm:services:runtimeStats')
  private handle: (data: Object) => void | undefined
  private noduleInstance: any
  private enabled: boolean = false

  init () {
    this.logger('init')
    if (process.env.PM2_APM_DISABLE_RUNTIME_STATS === 'true') {
      return this.logger('disabling service because of the environment flag')
    }
    // try to find the module
    const modulePath = utils.detectModule('@pm2/node-runtime-stats')
    if (typeof modulePath !== 'string') return
    // if we find it we can try to require it
    const RuntimeStats = utils.loadModule(modulePath)
    if (RuntimeStats instanceof Error) {
      return this.logger(`Failed to require module @pm2/node-runtime-stats: ${RuntimeStats.message}`)
    }
    this.noduleInstance = new RuntimeStats({
      delay: 1000
    })
    this.logger('starting runtime stats')
    this.noduleInstance.start()
    this.handle = (data) => {
      this.logger('received runtime stats', data)
      this.emit('data', data)
    }
    // seriously i just created it two lines above
    // @ts-ignore
    this.noduleInstance.on('sense', this.handle)
    this.enabled = true
  }

  /**
   * Is the service ready to send metrics about the runtime
   */
  isEnabled (): boolean {
    return this.enabled
  }

  destroy () {
    if (this.noduleInstance !== undefined && this.noduleInstance !== null) {
      this.logger('removing listener on runtime stats service')
      this.noduleInstance.removeListener('sense', this.handle)
      this.noduleInstance.stop()
    }
    this.logger('destroy')
  }
}
