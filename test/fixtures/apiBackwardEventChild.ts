import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.emit('myEvent', {prop1: 'value1'})
