import { Feature } from '../featureManager'
import AddonProfiler from '../profilers/addonProfiler'
import InspectorProfiler from '../profilers/inspectorProfiler'
import { canUseInspector } from '../constants'
import * as Debug from 'debug'

export interface ProfilerType {
  init (): void
  register (): void
  destroy (): void
}

export class ProfilingConfig {
  cpuJS: boolean
  heapSnapshot: boolean
  heapSampling: boolean
  implementation?: string
}

const defaultProfilingConfig: ProfilingConfig = {
  cpuJS: true,
  heapSnapshot: true,
  heapSampling: true,
  implementation: 'both'
}

const disabledProfilingConfig: ProfilingConfig = {
  cpuJS: false,
  heapSnapshot: false,
  heapSampling: false,
  implementation: 'none'
}

export class ProfilingFeature implements Feature {

  private profiler: ProfilerType | undefined
  private logger: Function = Debug('axm:features:profiling')

  init (config?: ProfilingConfig | boolean) {
    if (config === true) {
      config = defaultProfilingConfig
    } else if (config === false) {
      config = disabledProfilingConfig
    } else if (config === undefined) {
      config = defaultProfilingConfig
    }

    // allow to force the fallback to addon via the environment
    if (process.env.PM2_PROFILING_FORCE_FALLBACK === 'true') {
      config.implementation = 'addon'
    }
    // by default we check for the best suited one
    if (config.implementation === undefined || config.implementation === 'both') {
      config.implementation = canUseInspector() === true ? 'inspector' : 'addon'
    }

    switch (config.implementation) {
      case 'inspector': {
        this.logger('using inspector implementation')
        this.profiler = new InspectorProfiler()
        break
      }
      case 'addon': {
        this.logger('using addon implementation')
        this.profiler = new AddonProfiler()
        break
      }
      default: {
        return this.logger(`Invalid profiler implementation choosen: ${config.implementation}`)
      }
    }
    this.logger('init')
    this.profiler.init()
  }

  destroy () {
    this.logger('destroy')
    if (this.profiler === undefined) return
    this.profiler.destroy()
  }
}
