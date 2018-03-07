
import { Feature } from './featureTypes'
import { ServiceManager } from '../index'

export class NotifyOptions {
  level: string
}

export const NotifyOptionsDefault = {
  level: 'fatal'
}

export class NotifyFeature implements Feature {

  private options: NotifyOptions = NotifyOptionsDefault
  private transport
  private levels: Array<string> = ['fatal', 'error', 'warn', 'info', 'debug', 'trace']

  async init (options?: NotifyOptions): Promise<Object> {
    if (options) {
      this.options = options
    }

    this.transport = ServiceManager.get('transport')

    return {
      notify: this.notify
    }
  }

  notify (err: Error, level?: string) {

    if (!level || this.levels.indexOf(level) === -1) {
      return this.transport.send(err)
    }

    if (this.levels.indexOf(this.options.level) >= this.levels.indexOf(level)) {
      return this.transport.send(err)
    }

    return null
  }
}
