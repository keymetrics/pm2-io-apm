import debug from 'debug'
debug('axm:profiling')
import ProfilingType from './profilingType'
import FileUtils from '../utils/file'
import utils from '../utils/module'

export default class ProfilingHeapFallback implements ProfilingType {

  private profiler
  private snapshot
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
