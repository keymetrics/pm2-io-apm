
import pmx from '../../../src'
pmx.init({
  profiling: true
})

pmx.emit('myEvent', 'myValue')
