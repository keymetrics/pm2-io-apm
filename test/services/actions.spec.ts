import { expect } from 'chai'

import ActionsService from '../../src/services/actions'
import ActionsFeature from '../../src/features/actions'
import EventLoopInspector from '../../src/actions/eventLoopInspector'

describe('ActionsService', () => {

  describe('init', () => {
    it('Should not fail if unknown service is found in conf', () => {
      const actionsFeature = new ActionsFeature()
      const service = new ActionsService(actionsFeature)

      service.init({
        toto: true,
        eventLoopDump: true,
        titi: false
      })

      expect(service.get('toto')).to.equal(null)
      expect(service.get('titi')).to.equal(null)
      expect(service.get('eventLoopDump') instanceof EventLoopInspector).to.equal(true)
    })
  })
})
