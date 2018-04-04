import debug from 'debug'
debug('axm:profiling')
import ProfilingFeature from './profilingFeature'
import * as inspector from 'inspector'
import * as fs from 'fs'

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

  stop () {
    this.session.post('Profiler.stop', (err, { profile }) => {
      // write profile to disk
      if (!err) {
        fs.writeFileSync('./profile.cpuprofile', JSON.stringify(profile))
      } else {
        console.error(err)
      }

      debug('Cpu profiling stopped !')
    })
  }
}
