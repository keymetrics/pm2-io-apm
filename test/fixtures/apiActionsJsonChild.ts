
import pmx from '../../src'

// @ts-ignore
pmx.action({
  name: 'testActionWithConf',
  action: function (reply) { reply({data: 'testActionWithConfReply'}) }
})
