import Debug from 'debug'
const debug = Debug('axm:profilingaction')

import ActionsFeature from '../features/actions'
import ProfilingFeature from '../features/profiling'
import ActionsInterface from './actionsInterface'
import MiscUtils from '../utils/miscellaneous'
import { ServiceManager } from '../serviceManager'

export default class ProfilingHeapAction implements ActionsInterface {

  private actionFeature: ActionsFeature
  private profilingFeature: ProfilingFeature
  private config
  private uuid: string
  private profilings

  constructor (actionFeature: ActionsFeature, config?) {
    this.config = config
    if (!config) {
      this.config = {}
    }

    this.actionFeature = actionFeature
  }

  async init () {
    this.profilingFeature = new ProfilingFeature()
    this.profilings = this.profilingFeature.init()
    try {
      await this.profilings.heapProfiling.init(this.config.heap)
      this.exposeActions()
    } catch (err) {
      debug(`Failed to load heap profiler: ${err.message}`)
    }
  }

  destroy () {
    if (this.profilingFeature) this.profilingFeature.destroy()
  }

  private async stopProfiling (reply) {
    try {
      const data = await this.profilings.heapProfiling.stop()

      return reply({
        success     : true,
        heapprofile  : true,
        dump_file   : data,
        dump_file_size: data.length,
        uuid: this.uuid
      })

    } catch (err) {
      return reply({
        success: false,
        err : err,
        uuid: this.uuid
      })
    }
  }

  private exposeActions () {

    // -------------------------------------
    // Heap sampling
    // -------------------------------------
    const profilingReply = (data) => ServiceManager.get('transport').send('profilings', {
      data: data.dump_file,
      at: data.at,
      initiated: data.initiated || 'manual',
      duration: data.duration || null,
      type: 'heapprofile'
    })
    let startTime: Date | null = null
    this.actionFeature.action('km:heap:sampling:start', async (opts, reply) => {
      startTime = new Date()
      if (!reply) {
        reply = opts
        opts = {}
      }
      if (!opts) opts = {}

      try {
        this.uuid = MiscUtils.generateUUID()
        await this.profilings.heapProfiling.start()
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
          success: false,
          err : err,
          uuid: this.uuid
        })
      }

    })

    this.actionFeature.action('km:heap:sampling:stop', this.stopProfiling.bind(this, data => profilingReply({
      at: startTime,
      initiated: 'manual',
      duration: startTime ? new Date().getTime() - startTime.getTime() : null,
      ...data
    })))

    // -------------------------------------
    // Heap dump
    // -------------------------------------
    this.actionFeature.action('km:heapdump', async (opts, reply) => {
      if (!reply) {
        reply = opts
        opts = {}
      }
      if (!opts) opts = {}

      const startTime = new Date()
      try {
        const data = await this.profilings.heapProfiling.takeSnapshot()

        return ServiceManager.get('transport').send('profilings', {
          data,
          at: startTime,
          initiated: opts.initiated || 'manual',
          duration: new Date().getTime() - startTime.getTime(),
          type: 'heapdump'
        })
      } catch (err) {
        return reply({
          success: false,
          err : err
        })
      }
    })
  }
}
