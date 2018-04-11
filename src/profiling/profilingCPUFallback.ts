import debug from 'debug'
debug('axm:profiling')
import ProfilingType from './profilingType'
import FileUtils from '../utils/file'
import utils from '../utils/module'

export default class ProfilingCPUFallback implements ProfilingType {

  private nsCpuProfiling: string = 'km-cpu-profiling'
  private profiler
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
        throw new Error('Profiler not loaded !')
      }
    }

    this.profiler = utils.loadModule(path, moduleName)
  }

  destroy () {
    debug('Profiler destroyed !')
  }

  start () {
    this.profiler.startProfiling(this.nsCpuProfiling)
  }

  async stop () {
    return await this.getProfileInfo()
  }

  private getProfileInfo () {
    const cpu = this.profiler.stopProfiling(this.nsCpuProfiling)

    return FileUtils.writeDumpFile(JSON.stringify(cpu))
  }
}
