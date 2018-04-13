import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.init()
pmx.notifyError(new Error('myNotifyNotSend'))

pmx.init({
  level: 'warn'
})
pmx.notifyError(new Error('myNotify'), {
  level: 'error'
})
