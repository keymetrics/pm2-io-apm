import Debug from 'debug'
const debug = Debug('axm:profilingaction')

import ActionsFeature from '../features/actions'
import ProfilingFeature from '../features/profiling'
import ActionsInterface from './actionsInterface'
import MiscUtils from '../utils/miscellaneous'
import FileUtils from '../utils/file'
import Transport from '../utils/transport'

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
      const dumpFile = await this.profilings.cpuProfiling.stop()

      let size
      try {
        size = await FileUtils.getFileSize(dumpFile)
      } catch (err) {
        size = -1
      }

      return reply({
        success     : true,
        cpuprofile  : true,
        dump_file   : dumpFile,
        dump_file_size : size,
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

    this.actionFeature.action('km:cpu:profiling:start', async (opts, reply) => {
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
            const reply = (data) => Transport.send({
              type        : 'axm:reply',
              data        : {
                return      : data,
                action_name : 'km:cpu:profiling:stop'
              }
            })
            await this.stopProfiling(reply)
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

    this.actionFeature.action('km:cpu:profiling:stop', this.stopProfiling.bind(this))
  }
}
