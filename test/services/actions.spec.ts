
import { Action, ActionService } from '../../src/services/actions'
import { IPCTransport } from '../../src/transports/IPCTransport'
import { ServiceManager } from '../../src/serviceManager'
import * as assert from 'assert'

describe('ActionsService', function () {

  const transport = new IPCTransport()
  transport.init()
  ServiceManager.set('transport', transport)
  const service = new ActionService()
  service.init()
  const newAction = {
    name: 'toto',
    handler: (cb) => {
      return cb('data')
    }
  }

  describe('basic', () => {
    it('should register action', (done) => {
      transport.addAction = function (action: Action) {
        assert(action.name === newAction.name)
        return done()
      }
      service.registerAction(newAction.name, newAction.handler)
    })
    it('should call it', (done) => {
      transport.send = (channel, payload) => {
        assert(channel === 'axm:reply')
        assert(payload.action_name === 'toto')
        assert(payload.return === 'data')
        done()
        return undefined
      }
      transport.emit('data', 'toto')
    })
  })
})
