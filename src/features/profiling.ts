import debug from 'debug'
debug('axm:profiling')
import { Feature } from './featureTypes'
import ProfilingCPU from '../profiling/profilingCPU'

export default class ProfilingFeature implements Feature {

  init () {
    return {
      cpuProfiling: new ProfilingCPU()
    }
  }
}
