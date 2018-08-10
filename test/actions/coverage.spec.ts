import SpecUtils from '../fixtures/utils'
import { expect, assert } from 'chai'
import { fork, exec } from 'child_process'
import * as fs from 'fs'

let uuid

function common (res, child, done) {
  expect(res.data.return.success).to.equal(true)

  if (res.data.action_name === 'km:coverage:start') {
    uuid = res.data.return.uuid
  }

  if (res.data.action_name === 'km:coverage:stop') {

    fs.readFile(res.data.return.dump_file, 'utf8',function (err, data) {
      if (err) console.log(err)

      const json = JSON.parse(data)

      json.result.forEach(item => {
        if (item.url.indexOf('coverageChild.js') > 0) {
          item.functions.forEach(func => {
            if (func.functionName === 'mytimeout') {
              if (func.isBlockCoverage) {
                expect(func.ranges.length).to.equal(2)
                expect(func.ranges[0].count).to.equal(1)
                expect(func.ranges[0].startOffset).to.equal(535)
                expect(func.ranges[0].endOffset).to.equal(788)
                expect(func.ranges[1].count).to.equal(0)
                expect(func.ranges[1].startOffset).to.equal(732)
                expect(func.ranges[1].endOffset).to.equal(763)
              } else {
                expect(func.ranges.length).to.equal(1)
                expect(func.ranges[0].count).to.equal(1)
                expect(func.ranges[0].startOffset).to.equal(535)
                expect(func.ranges[0].endOffset).to.equal(788)
              }
            }
          })
        }
      })

      expect(res.data.return.coverage).to.equal(true)
      expect(res.data.return.uuid).to.equal(uuid)

      child.kill('SIGINT')
    })
  }
}

describe('CoverageAction', function () {
  this.timeout(20000)

  it('should get coverage data with details', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/actions/coverageChild.js'), [],{
      env: Object.assign({}, process.env, {
        FORCE_INSPECTOR: 1
      })
    })

    child.on('message', res => {

      if (res.type === 'axm:action') {
        expect(res.data.action_type).to.equal('internal')
      }

      if (res.type === 'axm:reply') {
        common(res, child, done)
      }

      if (res === 'initialized') {
        child.send({ msg: 'km:coverage:start', opts: { detailed: true } })

        setTimeout(function () {
          child.send('km:coverage:stop')
        }, 1000)
      }
    })

    child.on('exit', function () {
      done()
    })
  })

  it('should get coverage data wihtout details', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/actions/coverageChild.js'), [],{
      env: Object.assign({}, process.env, {
        FORCE_INSPECTOR: 1
      })
    })

    child.on('message', res => {

      if (res.type === 'axm:action') {
        expect(res.data.action_type).to.equal('internal')
      }

      if (res.type === 'axm:reply') {
        common(res, child, done)
      }

      if (res === 'initialized') {
        child.send('km:coverage:start')

        setTimeout(function () {
          child.send('km:coverage:stop')
        }, 1000)
      }
    })

    child.on('exit', function () {
      done()
    })
  })

  it('should get coverage data with timeout', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/actions/coverageChild.js'), [],{
      env: Object.assign({}, process.env, {
        FORCE_INSPECTOR: 1
      })
    })

    child.on('message', res => {

      if (res.type === 'axm:action') {
        expect(res.data.action_type).to.equal('internal')
      }

      if (res.type === 'axm:reply') {
        common(res, child, done)
      }

      if (res === 'initialized') {
        child.send({ msg: 'km:coverage:start', opts: { detailed: true, timeout: 800 } })
      }
    })

    child.on('exit', function () {
      done()
    })
  })

  it('should get coverage data with best effort', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/actions/coverageChild.js'), [],{
      env: Object.assign({}, process.env, {
        FORCE_INSPECTOR: 1
      })
    })

    child.on('message', res => {

      if (res.type === 'axm:action') {
        expect(res.data.action_type).to.equal('internal')
      }

      if (res.type === 'axm:reply') {
        common(res, child, done)
      }

      if (res === 'initialized') {
        child.send({ msg: 'km:coverage:start', opts: { method: 'getBestEffortCoverage', detailed: true } })

        setTimeout(function () {
          child.send('km:coverage:stop')
        }, 1000)
      }
    })

    child.on('exit', function () {
      done()
    })
  })
})
