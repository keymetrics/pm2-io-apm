import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

process.env.fixtures = JSON.stringify({
  envVar: 'value',
  password: 'toto'
})

const conf = pmx.initModule({
  test: 'toto'
})
