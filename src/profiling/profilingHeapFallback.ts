import debug from 'debug'
debug('axm:profiling')
import ProfilingType from './profilingType'
import FileUtils from '../utils/file'
import utils from '../utils/module'
import Configuration from '../configuration'

export default class ProfilingHeapFallback implements ProfilingType {

  private profiler
  private snapshot
  private MODULE_NAME = 'v8-profiler-node8'
  private FALLBACK_MODULE_NAME = 'v8-profiler'

  private configurationModule: Configuration

  constructor () {
    this.configurationModule = new Configuration()
  }

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
        this.configurationModule.configureModule({
          heapdump : false
        })
        throw new Error('Profiler not loaded !')
      }
    }

    this.profiler = utils.loadModule(path, moduleName)

    const enable = !(this.profiler instanceof Error)

    this.configurationModule.configureModule({
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
    return await this.getProfileInfo()
  }

  async takeSnapshot () {
    this.start()
    return await this.stop()
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
      return FileUtils.writeDumpFile(buffer, '.heapprofile')
    })
  }
}
