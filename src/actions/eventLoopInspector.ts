import ActionsFeature from '../features/actions'
import ActionsInterface from './actionsInterface'
import { ServiceManager } from '../serviceManager'

export default class Inspector implements ActionsInterface {

  private actionFeature: ActionsFeature

  constructor (actionFeature: ActionsFeature) {
    this.actionFeature = actionFeature
  }

  async init () {
    return new Promise((resolve, reject) => {

      this.exposeActions()

      return resolve()
    }).catch((e) => console.error(e))
  }

  private exposeActions () {

    this.actionFeature.action('km:event-loop-dump', function (reply) {
      const dump = ServiceManager.get('eventLoopService').inspector.dump()

      return reply({
        success: true,
        dump: dump
      })
    })
  }
}
