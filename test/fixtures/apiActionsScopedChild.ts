import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.scopedAction('testScopedAction', function (opts, res) { res.send('testScopedActionReply') })
