import { expect, assert } from 'chai'
import 'mocha'

import SpecUtils from '../fixtures/utils'
import { fork, exec } from 'child_process'
import * as semver from 'semver'

function checkDefaultValue (pck) {
  expect(pck.data.hasOwnProperty('New space used size')).to.equal(true)
  expect(pck.data.hasOwnProperty('Old space used size')).to.equal(true)
  expect(pck.data.hasOwnProperty('Map space used size')).to.equal(true)
  expect(pck.data.hasOwnProperty('Code space used size')).to.equal(true)

  expect(pck.data.hasOwnProperty('Heap size')).to.equal(true)
  expect(pck.data.hasOwnProperty('Heap size executable')).to.equal(true)
  expect(pck.data.hasOwnProperty('Used heap size')).to.equal(true)
  expect(pck.data.hasOwnProperty('Heap size limit')).to.equal(true)

  expect(Number.isInteger(pck.data['New space used size'].value)).to.equal(true)
  expect(Number.isInteger(pck.data['Old space used size'].value)).to.equal(true)
  expect(Number.isInteger(pck.data['Map space used size'].value)).to.equal(true)
  expect(Number.isInteger(pck.data['Code space used size'].value)).to.equal(true)

  expect(Number.isInteger(pck.data['Heap size'].value)).to.equal(true)
  expect(Number.isInteger(pck.data['Heap size executable'].value)).to.equal(true)
  expect(Number.isInteger(pck.data['Used heap size'].value)).to.equal(true)
  expect(Number.isInteger(pck.data['Heap size limit'].value)).to.equal(true)
}

describe('V8', function () {
  this.timeout(5000)
  it('should send all data with v8 heap info', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/metrics/v8Child.js'))

    child.on('message', pck => {

      if (pck.type === 'axm:monitor') {

        checkDefaultValue(pck)

        expect(pck.data.hasOwnProperty('Heap physical size')).to.equal(true)
        if (semver.satisfies(process.version, '>= 7.2.0')) {
          expect(pck.data.hasOwnProperty('Malloced memory')).to.equal(true)
          expect(pck.data.hasOwnProperty('Peak malloced memory')).to.equal(true)
        }
        expect(pck.data.hasOwnProperty('Heap available size')).to.equal(true)

        child.kill('SIGINT')
        done()
      }
    })
  })

  it('should send default data with v8 heap info', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/metrics/v8DefaultChild.js'))

    child.on('message', pck => {

      if (pck.type === 'axm:monitor') {
        expect(Object.keys(pck.data).length >= 8).to.equal(true)

        checkDefaultValue(pck)

        child.kill('SIGINT')
        done()
      }
    })
  })

  it('should send only some data, according to config', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/metrics/v8SomeDataChild.js'))

    child.on('message', pck => {

      if (pck.type === 'axm:monitor') {

        expect(pck.data.hasOwnProperty('New space used size')).to.equal(true)
        expect(pck.data.hasOwnProperty('Old space used size')).to.equal(false)
        expect(pck.data.hasOwnProperty('Map space used size')).to.equal(false)
        expect(pck.data.hasOwnProperty('Code space used size')).to.equal(false)

        expect(pck.data.hasOwnProperty('Heap physical size')).to.equal(true)

        expect(pck.data.hasOwnProperty('Heap size')).to.equal(false)
        expect(pck.data.hasOwnProperty('Heap size executable')).to.equal(false)
        expect(pck.data.hasOwnProperty('Used heap size')).to.equal(false)
        expect(pck.data.hasOwnProperty('Heap size limit')).to.equal(true)

        expect(Number.isInteger(pck.data['New space used size'].value)).to.equal(true)

        expect(Number.isInteger(pck.data['Heap physical size'].value)).to.equal(true)

        expect(Number.isInteger(pck.data['Heap size limit'].value)).to.equal(true)

        child.kill('SIGINT')
        done()
      }
    })
  })
})

describe('GC', function () {
  this.timeout(50000)

  before(function (done) {
    exec('npm install gc-stats', function (err) {
      expect(err).to.equal(null)
      setTimeout(done, 1000)
    })
  })

  after(function (done) {
    exec('npm uninstall gc-stats', function (err) {
      expect(err).to.equal(null)
      done()
    })
  })

  it('should get GC stats', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/metrics/v8Child.js'))

    child.on('message', pck => {

      if (pck.type === 'axm:monitor') {
        expect(pck.data.hasOwnProperty('GC Heap size')).to.equal(true)
        expect(pck.data.hasOwnProperty('GC Executable heap size')).to.equal(true)
        expect(pck.data.hasOwnProperty('GC Used heap size')).to.equal(true)
        expect(pck.data.hasOwnProperty('GC Type')).to.equal(true)
        expect(pck.data.hasOwnProperty('GC Pause')).to.equal(true)

        child.kill('SIGINT')
        done()
      }
    })
  })
})
