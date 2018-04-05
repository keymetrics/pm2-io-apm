import debug from 'debug'
debug('axm:profilingaction')

import ActionsFeature from '../features/actions'
import ProfilingFeature from '../features/profiling'

export default class ProfilingCPUAction {

  private actionFeature: ActionsFeature
  private profilingFeature

  constructor (actionFeature: ActionsFeature) {
    this.actionFeature = actionFeature
    this.profilingFeature = new ProfilingFeature().init()
    this.profilingFeature.cpuProfiling.init()
  }

  exposeActions () {

    this.actionFeature.action('km:cpu:profiling:start', (reply) => {
      this.profilingFeature.cpuProfiling.start()

      reply({ success : true })
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
