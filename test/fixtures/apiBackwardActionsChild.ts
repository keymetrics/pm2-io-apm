import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.init({
  event_loop_dump: true,
  profiling: true
})
