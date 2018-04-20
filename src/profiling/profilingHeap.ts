import debug from 'debug'
debug('axm:profiling')
import ProfilingType from './profilingType'
import FileUtils from '../utils/file'
import MetricConfig from '../utils/metricConfig'
import { InspectorService } from '../services/inspector'
import { ServiceManager } from '../serviceManager'

export default class ProfilingHeap implements ProfilingType {

  private config

  private defaultConf = {
    samplingInterval: 32768
  }

  private inspectorService: InspectorService

  constructor () {
    this.inspectorService = ServiceManager.get('inspector')
  }

  init (config?) {
    config = MetricConfig.getConfig(config, this.defaultConf)
    this.config = config

    this.inspectorService.createSession()
    this.inspectorService.connect()
    return this.inspectorService.post('HeapProfiler.enable')
  }

  async destroy () {
    await this.inspectorService.post('HeapProfiler.disable')
    this.inspectorService.disconnect()
  }

  start () {
    return this.inspectorService.post('HeapProfiler.startSampling', {samplingInterval: this.config.samplingInterval})
  }

  async stop () {
    return await this.getProfileInfo()
  }

  async takeSnapshot () {
    const chunks: Array<Object> = []
    this.inspectorService.on('HeapProfiler.addHeapSnapshotChunk', (data) => {
      chunks.push(data.params.chunk)
    })

    await this.inspectorService.post('HeapProfiler.takeHeapSnapshot', {reportProgress: false})

    return FileUtils.writeDumpFile(chunks.join(''), '.heapprofile')
  }

  private getProfileInfo () {
    return new Promise( async (resolve, reject) => {
      let data
      try {
        data = await this.inspectorService.post('HeapProfiler.stopSampling')
      } catch (err) {
        debug('Heap profiling stopped !')
        return reject(err)
      }

      resolve(FileUtils.writeDumpFile(JSON.stringify(data.profile), '.heapprofile'))
    })
  }
}
