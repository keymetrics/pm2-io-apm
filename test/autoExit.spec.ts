
import { fork } from 'child_process'
import { resolve } from 'path'

const launch = fixture => {
  return fork(resolve(__dirname, fixture), [], {
    execArgv: [ '-r', 'ts-node/register' ]
  })
}

describe('API', function () {
  this.timeout(10000)

  describe('AutoExit program', () => {
    it('should exit program when it has no more tasks to process', (done) => {
      const child = launch('fixtures/autoExitChild')
      child.on('exit', () => {
        done()
      })
    })
  })
})
