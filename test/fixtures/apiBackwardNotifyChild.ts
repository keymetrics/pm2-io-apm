
import pmx from '../../src'

// @ts-ignore
pmx.notify('test')
pmx.notify(new Error('testError'))
// @ts-ignore
pmx.notify({ success: false })

setTimeout(() => {
  process.exit(0)
}, 200)
