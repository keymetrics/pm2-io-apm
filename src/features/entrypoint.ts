import Debug from 'debug'
import PMX from '../pmx'
const debug = Debug('PM2-IO-APM')
const IO_KEY = Symbol.for('@pm2/io')

export default class Entrypoint {
  private io: PMX

  constructor () {
    try {
      this.io = global[IO_KEY]

      this.onStart(err => {
        if (err) {
          debug(err)
        }

        this.sensors()
        this.events()
        this.actuators()

        this.io.onExit((code, signal) => {
          this.onStop(err, () => {
            this.io.destroy()
          }, code, signal)
        })

        if (process && process.send) process.send('ready')
      })
    } catch (e) {
      // properly exit in case onStart/onStop method has not been override
      if (this.io) {
        this.io.destroy()
      }

      throw (e)
    }
  }

  events () {
    debug('No events !')
  }

  sensors () {
    debug('No metrics !')
  }

  actuators () {
    debug('No metrics !')
  }

  onStart (cb: Function) {
    throw new Error('Entrypoint onStart() not specified')
  }

  onStop (err: Error, cb: Function, code: number, signal: string) {
    cb() // by default only execute callback
  }

  conf () {
    return this.io.getConfig()
  }
}
