
import pmx from '../../src'

const Entrypoint = pmx.Entrypoint
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
