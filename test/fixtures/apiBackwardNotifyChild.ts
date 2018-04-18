import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.notify('test')
pmx.notify(new Error('testError'))
pmx.notify({ success: false })

setTimeout(() => {
  process.exit(0)
}, 200)
