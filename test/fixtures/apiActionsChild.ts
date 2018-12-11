import * as pmx from '../../src'

pmx.action('testAction', function (reply) {
  reply({ data: 'testActionReply' })
})
