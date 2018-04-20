import debug from 'debug'
debug('axm:profilingaction')

import ActionsFeature from '../features/actions'
import ProfilingFeature from '../features/profiling'
import ActionsInterface from './actionsInterface'

export default class ProfilingCPUAction implements ActionsInterface {

  private actionFeature: ActionsFeature
  private profilingFeature

  constructor (actionFeature: ActionsFeature) {
    this.actionFeature = actionFeature
  }

  async init () {
    this.profilingFeature = new ProfilingFeature().init()
    await this.profilingFeature.cpuProfiling.init()
    this.exposeActions()
  }

  private exposeActions () {

    this.actionFeature.action('km:cpu:profiling:start', async (reply) => {
      try {
        await this.profilingFeature.cpuProfiling.start()
        reply({ success : true })
      } catch (err) {
        return reply({
          success: false,
          err : err
        })
      }

    })

    this.actionFeature.action('km:cpu:profiling:stop', async (reply) => {
      try {
        const dumpFile = await this.profilingFeature.cpuProfiling.stop()

        return reply({
          success     : true,
          cpuprofile  : true,
          dump_file   : dumpFile
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
