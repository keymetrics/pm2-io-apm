import debug from 'debug'
import * as stringify from 'json-stringify-safe'

debug('axm:transport')

export default class Transport {
  send (args: Error | any, print?: Boolean): number {

    if (!print) print = false

    /**
     * For debug purpose
     */
    if (process.env.MODULE_DEBUG) {
      console.log(args)
    }

    if (!process.send) {
      return -1
    }

    const msg = args instanceof Error ? args.message : args.data.message

    try {
      process.send(JSON.parse(stringify(msg)))
    } catch (e) {
      console.error('Process disconnected from parent !')
      console.error(e.stack || e)
      process.exit(1)
    }

    return 0
  }
}
