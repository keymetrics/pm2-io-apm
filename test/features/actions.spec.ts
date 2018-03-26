import { fork } from 'child_process'
import { expect, assert } from 'chai'
import 'mocha'
import SpecUtils from '../fixtures/utils'
import ActionsFeature from '../../src/features/actions'

describe('ActionsFeature', () => {
  describe('action', () => {
    it('should create an action', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/features/actionsChild.js'))
      child.on('message', res => {
        if (res.type === 'axm:action') {
          expect(res.type).to.equal('axm:action')
          if (res.data.action_name === 'myAction') {
            expect(res.data.action_name).to.equal('myAction')
            expect(Object.keys(res.data.opts).length).to.equal(0)
          } else {
            expect(res.data.action_name).to.equal('myActionNoOpts')
            expect(res.data.opts).to.equal(null)
          }
          expect(res.data.arity).to.equal(1)

          child.send(res.data.action_name)
        } else if (res.type === 'axm:reply') {
          expect(res.type).to.equal('axm:reply')

          if (res.data.action_name === 'myAction') {
            expect(res.data.return.data).to.equal('testActionReply')
            expect(res.data.action_name).to.equal('myAction')
          } else if (res.data.action_name === 'myActionNoOpts') {
            expect(res.data.return.data).to.equal('myActionNoOptsReply')
            expect(res.data.action_name).to.equal('myActionNoOpts')
            child.kill('SIGINT')
            done()
          }
        }
      })
    })

    it('should return error/false in case of bad arguments', () => {
      const actions = new ActionsFeature()

      actions.init().then(() => {
        let res = actions.action(null)
        expect(res).to.equal(undefined)

        res = actions.action('testNoFn')
        expect(res).to.equal(undefined)
      })
    })
  })
})
