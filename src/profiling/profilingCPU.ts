import debug from 'debug'
debug('axm:profiling')
import ProfilingType from './profilingType'
import FileUtils from '../utils/file'
import { ServiceManager } from '../serviceManager'
import { InspectorService } from '../services/inspector'

export default class ProfilingCPU implements ProfilingType {

  private inspectorService: InspectorService

  constructor () {
    this.inspectorService = ServiceManager.get('inspector')
  }

  init () {
    this.inspectorService.createSession()
    this.inspectorService.connect()
    return this.inspectorService.post('Profiler.enable')
  }

  async destroy () {
    await this.inspectorService.post('Profiler.disable')
    this.inspectorService.disconnect()
  }

  start () {
    return this.inspectorService.post('Profiler.start')
  }

  async stop () {
    return await this.getProfileInfo()
  }

  private getProfileInfo () {
    return new Promise( async (resolve, reject) => {
      let data
      try {
        data = await this.inspectorService.post('Profiler.stop')
      } catch (err) {
        debug('Cpu profiling stopped !')
        return reject(err)
      }
      return resolve(FileUtils.writeDumpFile(JSON.stringify(data.profile)))
    })
  }
}
