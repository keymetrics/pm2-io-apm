import debug from 'debug'
debug('axm:profiling')
import ProfilingType from './profilingType'
import FileUtils from '../utils/file'
import utils from '../utils/module'

export default class ProfilingCPUFallback implements ProfilingType {

  private nsCpuProfiling: string = 'km-cpu-profiling'
  private profiler
  private MODULE_NAME = 'v8-profiler-node8'

  async init () {
    const path = await utils.getModulePath(this.MODULE_NAME)
    this.profiler = utils.loadModule(path, this.MODULE_NAME)

    if (this.profiler instanceof Error || !this.profiler) {
      throw new Error('Profiler not loaded !')
    }
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
