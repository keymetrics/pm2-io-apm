import SpecUtils from './fixtures/utils'
import { assert, expect } from 'chai'
import 'mocha'

import { exec, fork } from 'child_process'
import Histogram from '../src/utils/metrics/histogram'

describe('API', function () {
  this.timeout(5000)

  describe('AutoExit program', () => {
    it('should exit program when it has no more tasks to process', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/autoExitChild.js'))

      child.on('exit', () => {
        done()
      })
    })
  })
})
