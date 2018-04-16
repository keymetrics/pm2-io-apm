import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')

pmx.action('testAction', function (reply) { reply({data: 'testActionReply'}) })
