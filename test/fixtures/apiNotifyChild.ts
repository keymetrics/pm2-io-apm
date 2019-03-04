
import * as pmx from '../../src/index'

pmx.init()
try {
  throw new Error('myNotify')
} catch (err) {
  pmx.notifyError(err)
}