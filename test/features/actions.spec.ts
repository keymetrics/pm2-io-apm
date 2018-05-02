import { fork } from 'child_process'
import { expect, assert } from 'chai'
import 'mocha'
import SpecUtils from '../fixtures/utils'
import ActionsFeature from '../../src/features/actions'

describe('ActionsFeature', () => {
  describe('action', () => {
    it('should create an action and send basic action', (done) => {
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

    it('should create an action and send object action', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/features/actionsBasicChild.js'))
      child.on('message', res => {
        if (res.type === 'axm:action') {
          expect(res.type).to.equal('axm:action')
          expect(res.data.action_name).to.equal('myAction')
          child.send({msg: res.data.action_name})
        } else if (res.type === 'axm:reply') {
          expect(res.data.action_name).to.equal('myAction')
          expect(res.data.return.data).to.equal('myActionReply')
          child.kill('SIGINT')
          done()
        }
      })
    })

    it('should create an action and send object with opts', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/features/actions2ArgsChild.js'))
      child.on('message', res => {
        if (res.type === 'axm:action') {
          expect(res.type).to.equal('axm:action')
          expect(res.data.action_name).to.equal('myAction')
          child.send({msg: res.data.action_name, opts: {opts1: 'opts1'}})
        } else if (res.type === 'axm:reply') {
          expect(res.data.action_name).to.equal('myAction')
          expect(res.data.return.data).to.equal('myActionReply')
          expect(res.data.return.opts.opts1).to.equal('opts1')
          child.kill('SIGINT')
          done()
        }
      })
    })

    it('should create an action and send string with opts', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/features/actions2ArgsChild.js'))
      child.on('message', res => {
        if (res.type === 'axm:action') {
          expect(res.type).to.equal('axm:action')
          expect(res.data.action_name).to.equal('myAction')
          child.send(res.data.action_name)
        } else if (res.type === 'axm:reply') {
          expect(res.data.action_name).to.equal('myAction')
          expect(res.data.return.data).to.equal('myActionReply')
          expect(Object.keys(res.data.return.opts).length).to.equal(0)
          child.kill('SIGINT')
          done()
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

    it('should create action according to conf', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/features/actionsConfChild.js'))
      child.on('message', res => {
        if (res.type === 'axm:action') {
          expect(res.type).to.equal('axm:action')
          expect(res.data.action_name).to.equal('myActionConf')
          child.send(res.data.action_name)
        } else if (res.type === 'axm:reply') {
          expect(res.data.action_name).to.equal('myActionConf')
          expect(res.data.return.data).to.equal('myActionConfReply')
          expect(Object.keys(res.data.return.opts).length).to.equal(0)
          child.kill('SIGINT')
          done()
        }
      })
    })
  })

  describe('scopedAction', () => {
    it('should create an scoped action and send basic action', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/features/actionsScopedBasicChild.js'))
      child.on('message', res => {
        if (res.type === 'axm:action') {
          expect(res.type).to.equal('axm:action')
          // expect(res.data.action_name).to.equal('myScopedAction')
          expect(res.data.action_type).to.equal('scoped')
          child.send({action_name: res.data.action_name, uuid: 1000})
        } else if (res.type === 'axm:scoped_action:stream') {
          expect(res.type).to.equal('axm:scoped_action:stream')
          expect(res.data.uuid).to.equal(1000)
          expect(res.data.action_name).to.equal('myScopedAction')
          expect(res.data.data).to.equal('myScopedActionReply')
        } else if (res.type === 'axm:scoped_action:error') {
          expect(res.type).to.equal('axm:scoped_action:error')
          expect(res.data.uuid).to.equal(1000)
          expect(res.data.action_name).to.equal('myScopedErrorAction')
          expect(res.data.data).to.equal('myScopedActionReplyError')
        } else if (res.type === 'axm:scoped_action:end') {
          expect(res.type).to.equal('axm:scoped_action:end')
          expect(res.data.uuid).to.equal(1000)
          expect(res.data.action_name).to.equal('myScopedEndAction')
          expect(res.data.data).to.equal('myScopedActionReplyEnd')

          child.kill('SIGINT')
          done()
        }
      })
    })

    it('should failed cause domain error', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/features/actionsScopedDomainErrorChild.js'))
      child.on('message', res => {
        if (res.type === 'axm:action') {
          expect(res.type).to.equal('axm:action')
          // expect(res.data.action_name).to.equal('myScopedAction')
          expect(res.data.action_type).to.equal('scoped')
          child.send({action_name: res.data.action_name, uuid: 1000})
        } else if (res.type === 'axm:scoped_action:error') {
          expect(res.type).to.equal('axm:scoped_action:error')
          expect(res.data.uuid).to.equal(1000)
          expect(res.data.action_name).to.equal('myScopedAction')

          child.on('exit', function () {
            child.kill('SIGINT')
            done()
          })
        }
      })
    })
  })
})
