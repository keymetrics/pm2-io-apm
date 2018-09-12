import Debug from 'debug'
const debug = Debug('axm:profilingaction')

import ActionsFeature from '../features/actions'
import ProfilingFeature from '../features/profiling'
import ActionsInterface from './actionsInterface'
import MiscUtils from '../utils/miscellaneous'
import { ServiceManager } from '../serviceManager'

export default class ProfilingCPUAction implements ActionsInterface {

  private actionFeature: ActionsFeature
  private profilingFeature: ProfilingFeature
  private uuid: string
  private profilings

  constructor (actionFeature: ActionsFeature) {
    this.actionFeature = actionFeature
  }

  async init () {
    this.profilingFeature = new ProfilingFeature()
    this.profilings = this.profilingFeature.init()
    try {
      await this.profilings.cpuProfiling.init()
      // expose actions only if the feature is available
      this.exposeActions()
    } catch (err) {
      debug(`Failed to load cpu profiler: ${err.message}`)
    }
  }

  destroy () {
    if (this.profilingFeature) this.profilingFeature.destroy()
  }

  private async stopProfiling (reply) {
    try {
      const data = await this.profilings.cpuProfiling.stop()

      return reply({
        success     : true,
        cpuprofile  : true,
        dump_file   : data,
        dump_file_size : data.length,
        uuid        : this.uuid
      })
    } catch (err) {
      return reply({
        success : false,
        err     : err,
        uuid    : this.uuid
      })
    }
  }

  private exposeActions () {

    const profilingReply = (data) => ServiceManager.get('transport').send('profiling', {
      data: data.dump_file,
      at: data.at,
      initiated: data.initiated || 'manual',
      duration: data.duration || null,
      type: 'cpuprofile'
    })
    let startTime: Date | null  = null
    this.actionFeature.action('km:cpu:profiling:start', async (opts, reply) => {
      startTime = new Date()
      if (!reply) {
        reply = opts
        opts = {}
      }

      try {
        this.uuid = MiscUtils.generateUUID()
        await this.profilings.cpuProfiling.start()
        reply({ success : true, uuid: this.uuid })

        if (opts.timeout && typeof opts.timeout === 'number') {
          setTimeout(async _ => {
            await this.stopProfiling(data => profilingReply({
              at: startTime,
              initiated: opts.initiated,
              duration: startTime ? new Date().getTime() - startTime.getTime() : null,
              ...data
            }))
          }, opts.timeout)
        }
      } catch (err) {
        return reply({
          success : false,
          err     : err,
          uuid    : this.uuid
        })
      }
    })

    this.actionFeature.action('km:cpu:profiling:stop', this.stopProfiling.bind(this, data => profilingReply({
      at: startTime,
      initiated: 'manual',
      duration: startTime ? new Date().getTime() - startTime.getTime() : null,
      ...data
    })))
  }
}
