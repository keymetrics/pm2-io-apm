import * as io from '../../src'
import { IOConfig } from '../../src/pmx'

class MyEntrypoint extends io.Entrypoint {

  onStart (cb: Function) {
    return cb()
  }

  conf (): IOConfig {
    return {
      metrics: {
        eventLoop: false
      }
    }
  }
}

const entrypoint = new MyEntrypoint()
