import SpecUtils from './utils'

const Entrypoint = require(__dirname + '/../../src/index.js').Entrypoint
class MyEntrypoint extends Entrypoint {

  onStart (cb: Function) {
    cb()
  }

  onStop (err: Error | null, cb: Function) {
    if (process && process.send) process.send('Done')
    cb()
  }

  conf () {
    return {
      metrics: {
        eventLoopActive: false
      }
    }
  }
}

const entrypoint = new MyEntrypoint()
