import debug from 'debug'
debug('axm:profiling')
import { Feature } from './featureTypes'
import ProfilingCPUFallback from '../profiling/profilingCPUFallback'
import ProfilingHeapFallback from '../profiling/profilingHeapFallback'
import Configuration from '../configuration'

export default class ProfilingFeature implements Feature {

  private configurationModule: Configuration

  constructor () {
    this.configurationModule = new Configuration()
  }

  init (forceFallback?: boolean) {
    const isInspectorOk = require('semver').satisfies(process.version, '>= 8.0.0') && !forceFallback
    let ProfilingCPU
    let ProfilingHeap

    if (isInspectorOk) {
      ProfilingCPU = require('../profiling/profilingCPU').default
      ProfilingHeap = require('../profiling/profilingHeap').default
    }

    this.configurationModule.configureModule({
      heapdump : true
    })

    return {
      cpuProfiling: isInspectorOk ? new ProfilingCPU() : new ProfilingCPUFallback(),
      heapProfiling: isInspectorOk ? new ProfilingHeap() : new ProfilingHeapFallback()
    }
  }
}
