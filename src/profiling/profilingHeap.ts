import debug from 'debug'
debug('axm:profiling')
import ProfilingType from './profilingType'
import * as inspector from 'inspector'
import FileUtils from '../utils/file'
import MetricConfig from '../utils/metricConfig'

export default class ProfilingHeap implements ProfilingType {

  private session
  private config

  private defaultConf = {
    samplingInterval: 32768
  }

  async init (config?) {
    config = MetricConfig.getConfig(config, this.defaultConf)
    this.config = config

    this.session = new inspector.Session()
    this.session.connect()

    this.session.post('HeapProfiler.enable', () => {
      debug('Profiler enable !')
    })
  }

  destroy () {
    this.session.post('HeapProfiler.disable', () => {
      debug('Profiler enable !')
    })
    this.session.disconnect()
  }

  start () {
    return new Promise( (resolve, reject) => {
      this.session.post('HeapProfiler.startSampling', {samplingInterval: this.config.samplingInterval}, (err) => {
        if (err) return reject(err)
        debug('Heap profiling started ...')
        resolve()
      })
    })
  }

  async stop () {
    return await this.getProfileInfo()
  }

  async takeSnapshot () {
    const chunks: Array<Object> = []
    this.session.on('HeapProfiler.addHeapSnapshotChunk', (data) => {
      chunks.push(data.params.chunk)
    })

    await this.session.post('HeapProfiler.takeHeapSnapshot', {reportProgress: false})

    return FileUtils.writeDumpFile(chunks.join(''), '.heapprofile')
  }

  private getProfileInfo () {
    return new Promise( (resolve, reject) => {

      this.session.post('HeapProfiler.stopSampling', (err, data) => {
        // write profile to disk
        if (!err) {
          return resolve(FileUtils.writeDumpFile(JSON.stringify(data.profile), '.heapprofile'))
        } else {
          debug('Heap profiling stopped !')
          return reject(err)
        }
      })
    })
  }
}
