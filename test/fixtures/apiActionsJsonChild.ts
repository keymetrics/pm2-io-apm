import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.action({
  name: 'testActionWithConf',
  action: function (reply) { reply({data: 'testActionWithConfReply'}) }
})
