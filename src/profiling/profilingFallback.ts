import debug from 'debug'
debug('axm:profiling')
import ProfilingFeature from './profilingFeature'
import FileUtils from '../utils/file'

export default class ProfilingFallback implements ProfilingFeature {

  private nsCpuProfiling: string = 'km-cpu-profiling'
  private profiler

  init () {
    this.profiler = require('v8-profiler-node8')
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

    return FileUtils.writeDumpFile(cpu)
  }
}
