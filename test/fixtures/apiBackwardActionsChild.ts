import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.init({
  event_loop_dump: true,
  profiling: true
})

process.on('SIGINT', function () {
  pmx.destroy()
  process.exit(0)
})
