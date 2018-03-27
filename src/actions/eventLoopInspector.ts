import debug from 'debug'
debug('axm:profiling')

import utils from '../utils/module'
import ActionsFeature from '../features/actions'

export default class Inspector {

  private MODULE_NAME = 'event-loop-inspector'
  private actionFeature: ActionsFeature

  constructor (actionFeature: ActionsFeature) {
    this.actionFeature = actionFeature
  }

  eventLoopDump () {
    utils.detectModule(this.MODULE_NAME, (err, inspectorPath) => {
      if (err) {
        return false
      }

      return this.exposeActions(inspectorPath)
    })
  }

  private exposeActions (inspectorPath) {
    let inspector = utils.loadModule(inspectorPath, this.MODULE_NAME)

    /**
     * Heap snapshot
     */
    this.actionFeature.action('km:event-loop-dump', function (reply) {
      const dump = inspector.dump()

      return reply({
        success: true,
        dump: dump
      })
    })
  }
}
