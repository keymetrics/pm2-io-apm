import { Feature, FeatureConfig } from '../featureManager'
import AddonProfiler from '../profilers/addonProfiler'
import InspectorProfiler from '../profilers/inspectorProfiler'
import { canUseInspector } from '../constants'
import * as Debug from 'debug'

export interface ProfilerType {
  init (): void
  register (): void
  destroy (): void
}

export class ProfilingConfig extends FeatureConfig {
  cpu_js: boolean
  heap_snapshot: boolean
  heap_sampling: boolean
  implementation: string
}

const defaultProfilingConfig = {
  cpu_js: true,
  heap_snapshot: true,
  heap_sampling: true,
  implementation: 'both'
}

const disabledProfilingConfig = {
  cpu_js: false,
  heap_snapshot: false,
  heap_sampling: false,
  implementation: 'none'
}

export class ProfilingFeature implements Feature {

  private profiler: ProfilerType
  private logger: Function = Debug('axm:features:profiling')

  init (config: ProfilingConfig | boolean) {
    if (config === true) {
      config = defaultProfilingConfig
    } else if (config === false) {
      config = disabledProfilingConfig
    }
    // allow to force the fallback to addon via the environment
    if (process.env.PM2_PROFILING_FORCE_FALLBACK) {
      config.implementation = 'addon'
    }
    // by default we check for the best suited one
    if (config.implementation === 'both') {
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
    }
    this.logger('init')
    this.profiler.init()
  }

  destroy () {
    this.logger('destroy')
    if (this.profiler === null) return
    this.profiler.destroy()
  }
}
