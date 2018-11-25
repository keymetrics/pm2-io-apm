
import pmx from '../../src'

pmx.onExit(function () {
  if (process && process.send) process.send('callback')
})

setTimeout(function () {
  let toto

  console.log(toto.titi)
}, 500)
