import debug from 'debug'
debug('axm:profiling')
import { Feature } from './featureTypes'
import ProfilingCPUFallback from '../profiling/profilingCPUFallback'
import ProfilingHeapFallback from '../profiling/profilingHeapFallback'
import Configuration from '../configuration'

export default class ProfilingFeature implements Feature {

  private configurationModule: Configuration
  private profilings

  constructor () {
    this.configurationModule = new Configuration()
  }

  init (forceFallback?: boolean) {
    // allow to force the fallback via environment
    if (process.env.PM2_PROFILING_FORCE_FALLBACK) forceFallback = true

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

    this.profilings = {
      cpuProfiling: isInspectorOk ? new ProfilingCPU() : new ProfilingCPUFallback(),
      heapProfiling: isInspectorOk ? new ProfilingHeap() : new ProfilingHeapFallback()
    }

    return this.profilings
  }

  destroy () {
    for (let profilingName in this.profilings) {
      if (typeof this.profilings[profilingName].destroy === 'function') {
        this.profilings[profilingName].destroy()
      }
    }
  }
}
