import { NotifyFeature, NotifyOptions, NotifyOptionsDefault } from './features/notify'

class PMX {

  private notify: NotifyFeature

  constructor () {
    this.notify = new NotifyFeature()
  }

  async init (config?) {
    let notifyOptions: NotifyOptions = NotifyOptionsDefault

    if (config) {
      if (config.level) {
        notifyOptions = {
          level: config.level
        }
      }
    }
    await this.notify.init(notifyOptions)
  }

  notifyError (err: Error, context?) {
    let level = 'info'
    if (context && context.level) {
      level = context.level
    }

    this.notify.notifyError(err, level)
  }
}

module.exports = new PMX()
