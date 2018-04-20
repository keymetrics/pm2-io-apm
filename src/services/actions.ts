import debug from 'debug'
import ActionsFeature from '../features/actions'
import EventLoopInspector from '../actions/eventLoopInspector'
import ProfilingHeapAction from '../actions/profilingHeap'
import ProfilingCPUAction from '../actions/profilingCpu'

debug('axm:actionsService')

export default class ActionsService {

  private services: Map<string, any>

  constructor (actionsFeature: ActionsFeature) {
    this.services = new Map()
    this.services.set('eventLoopDump', new EventLoopInspector(actionsFeature))
    this.services.set('profilingCpu', new ProfilingCPUAction(actionsFeature))
    this.services.set('profilingHeap', new ProfilingHeapAction(actionsFeature))
  }

  init (config) {

    // init actions only if they are enabled in config
    for (let property in config) {
      if (config.hasOwnProperty(property) && config[property] !== false) {
        if (!this.services.has(property)) {
          console.error(`Action ${property} does not exist`)
          continue
        }

        this.services.get(property).init()
      }
    }
  }
}
