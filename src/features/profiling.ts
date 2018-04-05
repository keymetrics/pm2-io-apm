import debug from 'debug'
debug('axm:profiling')
import { Feature } from './featureTypes'
import ProfilingFallback from '../profiling/profilingFallback'
import Configuration from '../configuration'

export default class ProfilingFeature implements Feature {

  private configurationModule: Configuration

  constructor () {
    this.configurationModule = new Configuration()
  }

  init (forceFallback?: boolean) {
    const isProfilerOk = require('semver').satisfies(process.version, '>= 8.0.0') && !forceFallback
    let ProfilingCPU

    if (isProfilerOk) {
      ProfilingCPU = require('../profiling/profilingCPU').default
    }

    this.configurationModule.configureModule({
      heapdump : true
    })

    return {
      cpuProfiling: isProfilerOk ? new ProfilingCPU() : new ProfilingFallback()
    }
  }
}
