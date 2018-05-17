import Debug from 'debug'
import ActionsFeature from '../features/actions'
import EventLoopInspector from '../actions/eventLoopInspector'
import ProfilingHeapAction from '../actions/profilingHeap'
import ProfilingCPUAction from '../actions/profilingCpu'
import MetricConfig from '../utils/metricConfig'

const debug = Debug('axm:actionsService')

export default class ActionsService {

  private defaultConf = {
    profilingCpu: true,
    profilingHeap: true
  }

  private services: Map<string, any>

  constructor (actionsFeature: ActionsFeature) {
    this.services = new Map()
    this.services.set('eventLoopDump', new EventLoopInspector(actionsFeature))
    this.services.set('profilingCpu', new ProfilingCPUAction(actionsFeature))
    this.services.set('profilingHeap', new ProfilingHeapAction(actionsFeature))
  }

  init (config?, force?) {

    if (!force) {
      config = MetricConfig.getConfig(config, this.defaultConf)
    }

    // init actions only if they are enabled in config
    for (let property in config) {
      if (config.hasOwnProperty(property) && config[property] !== false) {
        if (!this.services.has(property)) {
          debug(`Action ${property} does not exist`)
          continue
        }

        this.services.get(property).init()
      }
    }
  }

  destroy () {
    this.services.forEach( (service, serviceName) => {
      if (service.destroy && typeof service.destroy === 'function') {
        service.destroy()
      }
    })
  }

  get (name: string) {
    if (!this.services.has(name)) {
      debug(`Service ${name} not found !`)
      return null
    }

    return this.services.get(name)
  }
}
