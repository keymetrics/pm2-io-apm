import debug from 'debug'
debug('axm:profilingaction')

import ActionsFeature from '../features/actions'
import ProfilingFeature from '../features/profiling'

export default class ProfilingHeapAction {

  private actionFeature: ActionsFeature
  private profilingFeature
  private config

  constructor (actionFeature: ActionsFeature, config?) {
    this.config = config
    if (!config) {
      this.config = {}
    }

    this.actionFeature = actionFeature
  }

  async init () {
    this.profilingFeature = new ProfilingFeature().init()
    this.profilingFeature.heapProfiling.init(this.config.heap)
    this.exposeActions()
  }

  private exposeActions () {

    // -------------------------------------
    // Heap sampling
    // -------------------------------------
    this.actionFeature.action('km:heap:sampling:start', async (reply) => {
      try {
        await this.profilingFeature.heapProfiling.start()
        reply({ success : true })
      } catch (err) {
        return reply({
          success: false,
          err : err
        })
      }

    })

    this.actionFeature.action('km:heap:sampling:stop', async (reply) => {
      try {
        const dumpFile = await this.profilingFeature.heapProfiling.stop()

        return reply({
          success     : true,
          heapdump  : true,
          dump_file   : dumpFile
        })
      } catch (err) {
        return reply({
          success: false,
          err : err
        })
      }
    })

    // -------------------------------------
    // Heap dump
    // -------------------------------------
    this.actionFeature.action('km:heapdump', async (reply) => {
      try {
        const dumpFile = await this.profilingFeature.heapProfiling.takeSnapshot()

        return reply({
          success     : true,
          heapdump    : true,
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
