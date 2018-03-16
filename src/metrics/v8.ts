import * as v8 from 'v8'
import utils from '../utils/module'
import MetricsFeature from '../features/metrics'
import MetricsInterface from './metricsInterface'

export default class V8Metric implements MetricsInterface {

  private timer
  private metricFeature: MetricsFeature
  private TIME_INTERVAL: number

  constructor (metricFeature: MetricsFeature) {
    this.TIME_INTERVAL = 1000
    this.metricFeature = metricFeature
  }

  init (config?: any) {
    let heapSpaceProbes
    let heapStatsTotal
    let heapStatsExecutable
    let heapStatsUsed
    let heapStatsLimit

    if (v8.hasOwnProperty('getHeapSpaceStatistics')) {
      heapSpaceProbes = {
        new_space: this.metricFeature.metric({
          name: 'New space used size',
          type: 'v8/heap/space/new',
          unit: 'kB',
          historic: true
        }),
        old_space: this.metricFeature.metric({
          name: 'Old space used size',
          type: 'v8/heap/space/old',
          unit: 'kB',
          historic: true
        }),
        map_space: this.metricFeature.metric({
          name: 'Map space used size',
          type: 'v8/heap/space/map',
          unit: 'kB',
          historic: false
        }),
        code_space: this.metricFeature.metric({
          name: 'Code space used size',
          type: 'v8/heap/space/code',
          unit: 'kB',
          historic: false
        }),
        large_object_space: this.metricFeature.metric({
          name: 'Large object space used size',
          type: 'v8/heap/space/large',
          unit: 'kB',
          historic: false
        })
      }
    }

    if (v8.hasOwnProperty('getHeapStatistics')) {
      heapStatsTotal = this.metricFeature.metric({
        name: 'Heap size',
        type: 'v8/heap/used',
        unit: 'kB',
        historic: true
      })

      heapStatsExecutable = this.metricFeature.metric({
        name: 'Heap size executable',
        type: 'v8/heap/executable',
        unit: 'kB',
        historic: false
      })

      heapStatsUsed = this.metricFeature.metric({
        name: 'Used heap size',
        type: 'v8/heap/used',
        unit: 'kB',
        historic: true
      })

      heapStatsLimit = this.metricFeature.metric({
        name: 'Heap size limit',
        type: 'v8/heap/limit',
        unit: 'kB',
        historic: true
      })
    }

    this.timer = setInterval(function () {
      if (v8.hasOwnProperty('getHeapSpaceStatistics')) {
        const data = v8.getHeapSpaceStatistics()

        for (let i = 0; i < data.length; i++) {
          const item = data[i]

          heapSpaceProbes[item.space_name].set(Math.round(item.space_used_size / 1000))
        }
      }

      if (v8.hasOwnProperty('getHeapStatistics')) {
        const heapStats = v8.getHeapStatistics()
        heapStatsTotal.set(Math.round(heapStats.total_heap_size / 1000))
        heapStatsExecutable.set(Math.round(heapStats.total_heap_size_executable / 1000))
        heapStatsUsed.set(Math.round(heapStats.used_heap_size / 1000))
        heapStatsLimit.set(Math.round(heapStats.heap_size_limit / 1000))
      }
    }, this.TIME_INTERVAL)

    utils.detectModule('gc-stats', function (err, gcPath) {
      if (err) {
        return false
      }
      return this._sendGCStats(this.metricFeature, gcPath)
    }.bind(this))
  }

  destroy () {
    clearInterval(this.timer)
  }

  _sendGCStats (metricFeature, gcPath) {
    let gc
    try {
      gc = (require(gcPath))()
    } catch (e) {
      console.error('error when requiring gc-stats on path', gcPath)
      console.error(e)
      return false
    }

    const gcHeapSize = metricFeature.metric({
      name: 'GC Heap size',
      type: 'v8/gc/heap/size',
      unit: 'kB',
      historic: true
    })

    const gcExecutableSize = metricFeature.metric({
      name: 'GC Executable heap size',
      type: 'v8/gc/heap/executable',
      unit: 'kB',
      historic: false
    })

    const gcUsedSize = metricFeature.metric({
      name: 'GC Used heap size',
      type: 'v8/gc/heap/used',
      unit: 'kB',
      historic: true
    })

    const gcType = metricFeature.metric({
      name: 'GC Type',
      type: 'v8/gc/type',
      historic: false
    })

    const gcPause = metricFeature.metric({
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
