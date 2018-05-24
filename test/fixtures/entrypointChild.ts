import SpecUtils from './utils'

const Entrypoint = require(__dirname + '/../../src/index.js').Entrypoint
class MyEntrypoint extends Entrypoint {

  onStart (cb: Function) {
    cb(new Error('test'))
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
