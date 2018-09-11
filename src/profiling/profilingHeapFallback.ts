import Debug from 'debug'
const debug = Debug('axm:profiling')
import ProfilingType from './profilingType'
import utils from '../utils/module'
import Configuration from '../configuration'

export default class ProfilingHeapFallback implements ProfilingType {

  private profiler
  private snapshot
  private MODULE_NAME = 'v8-profiler-node8'
  private FALLBACK_MODULE_NAME = 'v8-profiler'

  async init () {
    let path
    let moduleName = this.MODULE_NAME

    try {
      path = await utils.getModulePath(this.MODULE_NAME)
    } catch (e) {
      try {
        moduleName = this.FALLBACK_MODULE_NAME
        path = await utils.getModulePath(this.FALLBACK_MODULE_NAME)
      } catch (err) {
        Configuration.configureModule({
          heapdump : false
        })
        throw new Error('Profiler not loaded !')
      }
    }

    this.profiler = utils.loadModule(path, moduleName)

    const enable = !(this.profiler instanceof Error)

    Configuration.configureModule({
      heapdump : enable
    })
  }

  destroy () {
    debug('Profiler destroyed !')
  }

  start () {
    this.snapshot = this.profiler.takeSnapshot('km-heap-snapshot')
  }

  async stop () {
    return this.getProfileInfo()
  }

  async takeSnapshot () {
    this.start()
    return this.stop()
  }

  private getProfileInfo () {
    return new Promise(resolve => {
      let buffer = ''
      this.snapshot.serialize(
        (data, length) => {
          buffer += data
        },
        () => {
          this.snapshot.delete()

          resolve(buffer)
        }
      )
    }).then((buffer) => {
      return buffer
    })
  }
}
