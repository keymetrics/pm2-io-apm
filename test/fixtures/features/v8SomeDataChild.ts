import V8Metric from '../../../src/metrics/v8'
import Metric from '../../../src/features/metrics'

const metric = new Metric()
metric.init({
  v8: {
    new_space: true,
    old_space: false,
    map_space: false,
    code_space: false,
    large_object_space: false,
    total_heap_size: false,
    total_heap_size_executable: false,
    used_heap_size: false,
    heap_size_limit: true,
    total_physical_size: true // test non default metric
  },
  eventLoopDelay: false
})

process.on('SIGINT', function () {
  metric.destroy()
})
