
import { NotifyFeature } from './features/notify'
import { ProfilingFeature } from './features/profiling'
import { EventsFeature } from './features/events'
import { IOConfig } from './pmx'
import { MetricsFeature } from './features/metrics'
import { TracingFeature } from './features/tracing'
import { DependenciesFeature } from './features/dependencies'
import * as Debug from 'debug'

export function getObjectAtPath (context: Object, path: string): any {
  if (path.indexOf('.') === -1 && path.indexOf('[') === -1) {
    return context[path]
  }

  let crumbs = path.split(/\.|\[|\]/g)
  let i = -1
  let len = crumbs.length
  let result

  while (++i < len) {
    if (i === 0) result = context
    if (!crumbs[i]) continue
    if (result === undefined) break
    result = result[crumbs[i]]
  }

  return result
}

class AvailableFeature {
  /**
   * Name of the feature
   */
  name: string
  /**
   * The non-instancied class of the feature, used to init it
   */
  module: { new(): Feature }
  /**
   * Option path is the path of the configuration for this feature
   * Possibles values:
   *  - undefined: the feature doesn't need any configuration
   *  - '.': the feature need the top level configuration
   *  - everything else: the path to the value that contains the config, it can any anything
   */
  optionsPath?: string
  /**
   * Current instance of the feature used
   */
  instance?: Feature
}

const availablesFeatures: AvailableFeature[] = [
  {
    name: 'notify',
    optionsPath: '.',
    module: NotifyFeature
  },
  {
    name: 'profiler',
    optionsPath: 'profiling',
    module: ProfilingFeature
  },
  {
    name: 'events',
    module: EventsFeature
  },
  {
    name: 'metrics',
    optionsPath: 'metrics',
    module: MetricsFeature
  },
  {
    name: 'tracing',
    optionsPath: '.',
    module: TracingFeature
  },
  {
    name: 'dependencies',
    module: DependenciesFeature
  }
]

export class FeatureManager {

  private logger: Function = Debug('axm:features')
  /**
   * Construct all the features and init them with their respective configuration
   * It will return a map with each public API method
   */
  init (options: IOConfig): void {
    for (let availableFeature of availablesFeatures) {
      this.logger(`Creating feature ${availableFeature.name}`)
      const feature = new availableFeature.module()
      let config: any = undefined
      if (typeof availableFeature.optionsPath !== 'string') {
        config = {}
      } else if (availableFeature.optionsPath === '.') {
        config = options
      } else {
        config = getObjectAtPath(options, availableFeature.optionsPath)
      }
      this.logger(`Init feature ${availableFeature.name}`)
      // @ts-ignore
      // thanks mr typescript but we don't know the shape that the
      // options will be, so we just ignore the warning there
      feature.init(config)
      availableFeature.instance = feature
    }
  }

  /**
   * Get a internal implementation of a feature method
   * WARNING: should only be used by user facing API
   */
  get (name: string): Feature {
    const feature = availablesFeatures.find(feature => feature.name === name)
    if (feature === undefined || feature.instance === undefined) {
      throw new Error(`Tried to call feature ${name} which doesn't exist or wasn't initiated`)
    }
    return feature.instance
  }

  destroy () {
    for (let availableFeature of availablesFeatures) {
      if (availableFeature.instance === undefined) continue
      this.logger(`Destroy feature ${availableFeature.name}`)
      availableFeature.instance.destroy()
    }
  }
}

// just to be able to cast
export class FeatureConfig { }

export interface Feature {
  init (config?: any): void
  destroy (): void
}
