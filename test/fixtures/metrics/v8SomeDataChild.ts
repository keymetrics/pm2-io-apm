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
  }
}, true)

// set something into event loop. Else test will exit immediately
const timer = setInterval(function () {}, 5000)

process.on('SIGINT', function () {
  clearInterval(timer)
  metric.destroy()
})
