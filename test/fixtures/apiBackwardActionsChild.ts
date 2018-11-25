
import pmx from '../../src'

pmx.init({
  event_loop_dump: true,
  profiling: true
})

process.on('SIGINT', function () {
  pmx.destroy()
  process.exit(0)
})
