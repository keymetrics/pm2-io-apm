import * as v8 from 'v8'
import utils from '../utils/module'
import MetricsFeature from '../features/metrics'
import MetricsInterface from './metricsInterface'
import * as merge from 'deepmerge'

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
      heapSize: true,
      executableSize: true,
      usedSize: true,
      type: true,
      pause: true
    }
  }

  constructor (metricFeature: MetricsFeature) {
    this.TIME_INTERVAL = 1000
    this.metricFeature = metricFeature
  }

  init (config?: any | boolean) {
    if (!config) {
      config = this.defaultConf
    } else if (config !== true) {
      config = merge(this.defaultConf, config)
    }

    let heapSpaceProbes
    let heapProbes

    if (v8.hasOwnProperty('getHeapSpaceStatistics')) {
      heapSpaceProbes = {}

      for (let metricName in this.allPossibleMetrics) {
        if (this.allPossibleMetrics.hasOwnProperty(metricName) && (config === true || config[metricName] === true)) {
          heapSpaceProbes[metricName] = this.metricFeature.metric(this.allPossibleMetrics[metricName])
        }
      }
    }

    if (v8.hasOwnProperty('getHeapStatistics')) {
      heapProbes = {}
      for (let metricName in this.allPossibleMetrics) {
        if (this.allPossibleMetrics.hasOwnProperty(metricName) && (config === true || config[metricName] === true)) {
          heapProbes[metricName] = this.metricFeature.metric(this.allPossibleMetrics[metricName])
        }
      }
    }

    this.timer = setInterval(function () {
      if (v8.hasOwnProperty('getHeapSpaceStatistics')) {
        const data = v8.getHeapSpaceStatistics()

        for (let i = 0; i < data.length; i++) {
          const item = data[i]

          if (heapSpaceProbes.hasOwnProperty(item.space_name)) {
            heapSpaceProbes[item.space_name].set(Math.round(item.space_used_size / 1000))
          }
        }
      }

      if (v8.hasOwnProperty('getHeapStatistics')) {
        const heapStats = v8.getHeapStatistics()
        for (let metricName in heapStats) {
          if (heapStats.hasOwnProperty(metricName) && heapProbes.hasOwnProperty(metricName)) {
            const value = ( this.allPossibleMetrics[metricName].unit === this.unitKB ) ? Math.round(heapStats[metricName] / 1000) : heapStats[metricName]
            heapProbes[metricName].set(value)
          }
        }
      }
    }.bind(this), this.TIME_INTERVAL)

    utils.detectModule('gc-stats', function (err, gcPath) {
      if (err) {
        return false
      }
      return this._sendGCStats(gcPath)
    }.bind(this))
  }

  destroy () {
    clearInterval(this.timer)
  }

  _sendGCStats (gcPath) {
    let gc
    try {
      gc = (require(gcPath))()
    } catch (e) {
      console.error('error when requiring gc-stats on path', gcPath)
      console.error(e)
      return false
    }

    const gcHeapSize = this.metricFeature.metric({
      name: 'GC Heap size',
      type: 'v8/gc/heap/size',
      unit: 'kB',
      historic: true
    })

    const gcExecutableSize = this.metricFeature.metric({
      name: 'GC Executable heap size',
      type: 'v8/gc/heap/executable',
      unit: 'kB',
      historic: false
    })

    const gcUsedSize = this.metricFeature.metric({
      name: 'GC Used heap size',
      type: 'v8/gc/heap/used',
      unit: 'kB',
      historic: true
    })

    const gcType = this.metricFeature.metric({
      name: 'GC Type',
      type: 'v8/gc/type',
      historic: false
    })

    const gcPause = this.metricFeature.metric({
      name: 'GC Pause',
      type: 'v8/gc/pause',
      unit: 'ms',
      historic: false
    })

    gc.on('stats', function (stats) {
      gcHeapSize.set(Math.round(stats.after.totalHeapSize / 1000))
      gcExecutableSize.set(Math.round(stats.after.totalHeapExecutableSize / 1000))
      gcUsedSize.set(Math.round(stats.after.usedHeapSize / 1000))
      gcType.set(stats.gctype)
      gcPause.set(Math.round(stats.pause / 1000000)) // convert to milliseconds (cause pauseMs seems to use Math.floor)
    })
  }
}
