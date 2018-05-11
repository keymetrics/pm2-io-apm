import * as inspector from 'inspector'
import debug from 'debug'
debug('axm:inspectorservice')

export class InspectorService {

  private session
  private isConnected: boolean = false

  createSession () {
    if (!this.session) {
      this.session = new inspector.Session()
    }

    return this.session
  }

  post (action, params?) {
    return new Promise((resolve, reject) => {
      this.session.post(action, params, (err, data) => {
        if (err) return reject(err)
        debug(action + ' !')
        resolve(data)
      })
    })
  }

  on (eventName, callback) {
    this.session.on(eventName, callback)
  }

  connect () {
    if (!this.isConnected) {
      this.session.connect()
    }
    this.isConnected = true
  }

  disconnect () {
    if (this.isConnected) {
      this.session.post('Profiler.disable')

      this.session.disconnect()
      this.isConnected = false
    } else {
      debug('No open session !')
    }
  }
}

module.exports = new InspectorService()
