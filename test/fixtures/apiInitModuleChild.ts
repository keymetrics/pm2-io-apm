
import pmx from '../../src'

process.env.fixtures = JSON.stringify({
  envVar: 'value',
  password: 'toto'
})

const conf = pmx.initModule({
  test: 'toto'
})
