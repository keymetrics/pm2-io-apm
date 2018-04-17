import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.onExit(function () {
  if (process && process.send) process.send('callback')
})
