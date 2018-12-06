
import pmx from '../../src'

// @ts-ignore
pmx.notify('test')
pmx.notify(new Error('testError'))

setTimeout(() => {
  process.exit(0)
}, 200)
