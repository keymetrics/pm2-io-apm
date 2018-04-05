import SpecUtils from '../fixtures/utils'
import { expect } from 'chai'
import { fork, exec } from 'child_process'
import Action from '../../src/features/actions'

describe('ProfilingCPUAction', function () {
  this.timeout(5000)

  it('should get cpu profile data', (done) => {
    const child = fork(SpecUtils.buildTestPath('fixtures/actions/profilingChild.js'))

    child.on('message', res => {

      if (res.type === 'axm:reply') {
        expect(res.data.return.success).to.equal(true)

        if (res.data.action_name === 'km:cpu:profiling:stop') {
          expect(res.data.return.cpuprofile).to.equal(true)
          expect(typeof res.data.return.dump_file).to.equal('string')

          child.kill('SIGINT')
          done()
        }
      }
    })

    setTimeout(function () {
      child.send('km:cpu:profiling:start')
    }, 100)

    setTimeout(function () {
      child.send('km:cpu:profiling:stop')
    }, 1000)
  })
})
