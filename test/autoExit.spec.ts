
import { exec } from 'child_process'
import { resolve } from 'path'

const launch = fixture => {
  return exec(`node -r ts-node/register ${resolve(__dirname, fixture)}`)
}

describe('API', function () {
  this.timeout(20000)

  describe('AutoExit program', () => {
    it('should exit program when it has no more tasks to process', (done) => {
      const child = launch('fixtures/autoExitChild')
      child.on('exit', () => {
        done()
      })
    })
  })
})
