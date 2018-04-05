import debug from 'debug'
debug('axm:profiling')
import ProfilingFeature from './profilingFeature'
import * as inspector from 'inspector'
import FileUtils from '../utils/file'

export default class ProfilingCPU implements ProfilingFeature {

  private session

  init () {
    this.session = new inspector.Session()
    this.session.connect()

    this.session.post('Profiler.enable', () => {
      debug('Profiler enable !')
    })
  }

  destroy () {
    this.session.disconnect()
  }

  start () {
    this.session.post('Profiler.start', () => {
      debug('Cpu profiling started ...')
    })
  }

  async stop () {
    return await this.getProfileInfo()
  }

  private getProfileInfo () {
    return new Promise( (resolve, reject) => {
      this.session.post('Profiler.stop', (err, data) => {
        // write profile to disk
        if (!err) {
          return resolve(FileUtils.writeDumpFile(data.profile))
        } else {
          debug('Cpu profiling stopped !')
          return reject(err)
        }
      })
    })
  }
}
