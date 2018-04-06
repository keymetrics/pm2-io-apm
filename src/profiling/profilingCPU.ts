import debug from 'debug'
debug('axm:profiling')
import ProfilingType from './profilingType'
import * as inspector from 'inspector'
import FileUtils from '../utils/file'

export default class ProfilingCPU implements ProfilingType {

  private session

  async init () {
    this.session = new inspector.Session()
    this.session.connect()

    this.session.post('Profiler.enable', () => {
      debug('Profiler enable !')
    })
  }

  destroy () {
    this.session.post('Profiler.disable', () => {
      debug('Profiler enable !')
    })
    this.session.disconnect()
  }

  start () {
    return new Promise( (resolve, reject) => {
      this.session.post('Profiler.start', (err) => {
        if (err) return reject(err)
        debug('Cpu profiling started ...')
        resolve()
      })
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
