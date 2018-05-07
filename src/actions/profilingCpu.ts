import debug from 'debug'
debug('axm:profilingaction')

import ActionsFeature from '../features/actions'
import ProfilingFeature from '../features/profiling'
import ActionsInterface from './actionsInterface'
import MiscUtils from '../utils/miscellaneous'
import FileUtils from '../utils/file'

export default class ProfilingCPUAction implements ActionsInterface {

  private actionFeature: ActionsFeature
  private profilingFeature
  private uuid: string

  constructor (actionFeature: ActionsFeature) {
    this.actionFeature = actionFeature
  }

  async init () {
    this.profilingFeature = new ProfilingFeature().init()
    try {
      await this.profilingFeature.cpuProfiling.init()
      // expose actions only if the feature is available
      this.exposeActions()
    } catch (err) {
      console.error(`Failed to load cpu profiler: ${err.message}`)
    }
  }

  destroy () {
    if (this.profilingFeature) this.profilingFeature.destroy()
  }

  private exposeActions () {

    this.actionFeature.action('km:cpu:profiling:start', async (reply) => {
      try {
        this.uuid = MiscUtils.generateUUID()
        await this.profilingFeature.cpuProfiling.start()
        reply({ success : true, uuid: this.uuid })
      } catch (err) {
        return reply({
          success : false,
          err     : err,
          uuid    : this.uuid
        })
      }
    })

    this.actionFeature.action('km:cpu:profiling:stop', async (reply) => {
      try {
        const dumpFile = await this.profilingFeature.cpuProfiling.stop()

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
    })
  }
}
