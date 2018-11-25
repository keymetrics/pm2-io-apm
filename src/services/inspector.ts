import * as inspector from 'inspector'
import Debug from 'debug'

export class InspectorService {

  private session: inspector.Session | null = null
  private logger: Function = Debug('axm:services:inspector')

  init (): inspector.Session {
    this.logger(`Creating new inspector session`)
    this.session = new inspector.Session()
    this.session.connect()
    this.logger('Connected to inspector')
    return this.session
  }

  getSession (): inspector.Session {
    if (this.session === null) {
      this.session = this.init()
      return this.session
    } else {
      return this.session
    }
  }

  destroy () {
    if (this.session !== null) {
      this.session.post('Profiler.disable')
      this.session.post('HeapProfiler.disable')
      this.session.disconnect()
      this.session = null
    } else {
      this.logger('No open session')
    }
  }
}

module.exports = InspectorService
