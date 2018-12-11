
import * as pmx from '../../../src'

pmx.init({
  profiling: true
})

setInterval(_ => {
  pmx.emit('myEvent', { prop1: 'value1' })
}, 100)
