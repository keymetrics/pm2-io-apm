import * as v8 from 'v8'
import utils from '../utils/module'
import MetricsFeature from '../features/metrics'
import MetricsInterface from './metricsInterface'
import MetricConfig from '../utils/metricConfig'

import Debug from 'debug'
const debug = Debug('axm:v8')

export default class V8Metric implements MetricsInterface {

  private timer
  private metricFeature: MetricsFeature
  private TIME_INTERVAL: number

  private unitKB = 'kB'

  private allPossibleMetrics = {
    new_space: {
      name: 'New space used size',
      type: 'v8/heap/space/new',
      unit: this.unitKB,
      historic: true
    },
    old_space: {
      name: 'Old space used size',
      type: 'v8/heap/space/old',
      unit: this.unitKB,
      historic: true
    },
    map_space: {
      name: 'Map space used size',
      type: 'v8/heap/space/map',
      unit: this.unitKB,
      historic: false
    },
    code_space: {
      name: 'Code space used size',
      type: 'v8/heap/space/code',
      unit: this.unitKB,
      historic: false
    },
    large_object_space: {
      name: 'Large object space used size',
      type: 'v8/heap/space/large',
      unit: this.unitKB,
      historic: false
    },
    total_physical_size: {
      name: 'Heap physical size',
      type: 'v8/heap/physical',
      unit: 'kB',
      historic: false
    },
    total_heap_size: {
      name: 'Heap size',
      type: 'v8/heap/used',
      unit: 'kB',
      historic: true
    },
    total_available_size: {
      name: 'Heap available size',
      type: 'v8/heap/available',
      unit: 'kB',
      historic: true
    },
    total_heap_size_executable: {
      name: 'Heap size executable',
      type: 'v8/heap/executable',
      unit: this.unitKB,
      historic: false
    },
    used_heap_size: {
      name: 'Used heap size',
      type: 'v8/heap/used',
      unit: this.unitKB,
      historic: true
    },
    heap_size_limit: {
      name: 'Heap size limit',
      type: 'v8/heap/limit',
      unit: this.unitKB,
      historic: true
    },
    malloced_memory: {
      name: 'Malloced memory',
      type: 'v8/heap/malloced',
      unit: this.unitKB,
      historic: false
    },
    peak_malloced_memory: {
      name: 'Peak malloced memory',
      type: 'v8/heap/peakmalloced',
      unit: this.unitKB,
      historic: false
    },
    does_zap_garbage: {
      name: 'Zap garbage',
      type: 'v8/heap/zapgarbage',
      unit: '',
      historic: false
    },
    GC: {
      totalHeapSize: {
        name: 'GC Heap size',
        type: 'v8/gc/heap/size',
        unit: this.unitKB,
        historic: true
      },
      totalHeapExecutableSize: {
        name: 'GC Executable heap size',
        type: 'v8/gc/heap/executable',
        unit: this.unitKB,
        historic: false
      },
      usedHeapSize: {
        name: 'GC Used heap size',
        type: 'v8/gc/heap/used',
        unit: this.unitKB,
        historic: true
      },
      heapSizeLimit: {
        name: 'GC heap size limit',
        type: 'v8/gc/heap/limit',
        unit: this.unitKB,
        historic: false
      },
      totalPhysicalSize: {
        name: 'GC physical size',
        type: 'v8/gc/heap/physical',
        unit: this.unitKB,
        historic: false
      },
      totalAvailableSize: {
        name: 'GC available size',
        type: 'v8/gc/heap/available',
        unit: this.unitKB,
        historic: false
      },
      mallocedMemory: {
        name: 'GC malloced memory',
        type: 'v8/gc/heap/malloced',
        unit: this.unitKB,
        historic: false
      },
      peakMallocedMemory: {
        name: 'GC peak malloced memory',
        type: 'v8/gc/heap/peakmalloced',
        unit: this.unitKB,
        historic: false
      },
      gcType: {
        name: 'GC Type',
        type: 'v8/gc/type',
        historic: false
      },
      gcPause: {
        name: 'GC Pause',
        type: 'v8/gc/pause',
        unit: 'ms',
        historic: false
      }
    }
  }

  private defaultConf = {
    new_space: true,
    old_space: true,
    map_space: true,
    code_space: true,
    large_object_space: true,
    total_heap_size: true,
    total_heap_size_executable: true,
    used_heap_size: true,
    heap_size_limit: true,
    GC: {
      totalHeapSize: true,
      totalHeapExecutableSize: true,
      usedHeapSize: true,
      gcType: true,
      gcPause: true
    }
  }

  constructor (metricFeature: MetricsFeature) {
    this.TIME_INTERVAL = 1000
    this.metricFeature = metricFeature
  }

  init (config?: any | boolean) {
    config = MetricConfig.getConfig(config, this.defaultConf)

    let heapProbes
    const self = this

    if (v8.hasOwnProperty('getHeapSpaceStatistics') && v8.hasOwnProperty('getHeapStatistics')) {
      heapProbes = MetricConfig.initProbes(this.allPossibleMetrics, config, this.metricFeature)
    }

    this.timer = setInterval(function () {
      if (v8.hasOwnProperty('getHeapSpaceStatistics')) {
        const data = v8.getHeapSpaceStatistics()

        for (let i = 0; i < data.length; i++) {
          const item = data[i]

          if (heapProbes.hasOwnProperty(item.space_name)) {
            heapProbes[item.space_name].set(Math.round(item.space_used_size / 1000))
          }
        }
      }

      if (v8.hasOwnProperty('getHeapStatistics')) {
        const heapStats = v8.getHeapStatistics()
        MetricConfig.setProbesValue(this.allPossibleMetrics, heapStats, heapProbes, self.unitKB)
      }
    }.bind(this), this.TIME_INTERVAL)

    utils.detectModule('gc-stats', (err, gcPath) => {
      if (err) {
        return false
      }
      return this._sendGCStats(gcPath, config.GC)
    })
  }

  destroy () {
    clearInterval(this.timer)
  }

  private _sendGCStats (gcPath, config) {
    let gc
    try {
      gc = (require(gcPath))()
    } catch (e) {
      debug('error when requiring gc-stats on path', gcPath)
      debug(e)
      return false
    }

    config = MetricConfig.getConfig(config, this.defaultConf.GC)

    const gcProbes = MetricConfig.initProbes(this.allPossibleMetrics.GC, config, this.metricFeature)
    const self = this

    gc.on('stats', (stats) => {

      MetricConfig.setProbesValue(this.allPossibleMetrics.GC, stats.after, gcProbes, self.unitKB)

      gcProbes['gcType'].set(stats.gctype)
      gcProbes['gcPause'].set(Math.round(stats.pause / 1000000)) // convert to milliseconds (cause pauseMs seems to use Math.floor)
    })
  }
}
