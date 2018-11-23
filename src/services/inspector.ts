import * as inspector from 'inspector'
import Debug from 'debug'

export class InspectorService extends inspector.Session {

  private session: inspector.Session | null = null
  private isConnected: boolean = false
  private logger: Function = Debug('axm:services:inspector')

  createSession () {
    if (this.session === null) {
      this.session = new inspector.Session()
    }
    return this.session
  }

  post (action, params?) {
    this.logger(`posting message with action ${action}`)
    let session = this.session === null ? this.connect() : this.session
    return session.post.apply(this, arguments)
  }

  on (event: string, handler: Function) {
    this.logger(`listening from inspector message ${event}`)
    let session = this.session === null ? this.connect() : this.session
    return session.on.apply(this, arguments)
  }

  removeListener (event: string, handler: Function) {
    if (this.session === null) return
    return this.session.removeListener.apply(this, arguments)
  }

  removeAllListeners () {
    if (this.session === null) return
    return this.session.removeAllListeners.apply(this, arguments)
  }

  connect (): inspector.Session {
    let session = this.session
    if (session === null) {
      session = this.createSession()
      this.session = session
      session.connect()
    }
    if (!this.isConnected) {
      session.connect()
    }
    this.isConnected = true
    return session
  }

  destroy () {
    if (this.isConnected === true && this.session !== null) {
      this.session.post('Profiler.disable')
      this.session.post('Profiler.disable')
      this.session.disconnect()
      this.isConnected = false
      this.session = null
    } else {
      this.logger('No open session')
    }
  }
}

module.exports = new InspectorService()
