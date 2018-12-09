import pmx from '../../../src'
pmx.init({
  metrics: {
    eventLoop: true,
    gc: true,
    v8: true
  }
})
if (process && process.send) {
  process.send('initialized')
}

setInterval(_ => {
  let str = 0
  for (let i = 0; i < 100; i++) {
    str = str + str
  }
}, 1000)
