import { ActionService } from '../services/actions'
import { ServiceManager } from '../serviceManager'
import { Feature } from '../featureManager'
import * as EventLoopInspector from 'event-loop-inspector'
import * as Debug from 'debug'

class EventLoopInspectorConfig {
  enabled: boolean
}

export class EventLoopInspectorFeature implements Feature {

  private actionService: ActionService | undefined
  private logger: Function = Debug('axm:features:actions:eventloop')
  private eventLoopInspector

  init (config?: EventLoopInspectorConfig | boolean) {
    if (config === false) return
    if (config === undefined) return
    if (config === true) {
      config = { enabled: true }
    }
    if (config.enabled === false) return

    this.actionService = ServiceManager.get('actions')
    if (this.actionService === undefined) {
      return this.logger('cannot expose actions as action service isnt available')
    }
    // enable the dumper
    this.eventLoopInspector = EventLoopInspector(false)

    this.actionService.registerAction('km:event-loop-dump', (cb) => {
      return cb({
        success: true,
        dump: this.eventLoopInspector.dump()
      })
    })
  }

  destroy () {
    this.logger('destroy')
  }
}
