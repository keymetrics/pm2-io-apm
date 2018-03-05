
import { Feature } from './featureTypes';
import { ServiceManager } from '../index'

export interface NotifyOptions {
  level: String
}

export const NotifyOptionsDefault = {
  level: 'fatal'
}

export class NotifyFeature implements Feature {
  
  private options: NotifyOptions = NotifyOptionsDefault;
  private transport;

  async init (manager: ServiceManager, options?: NotifyOptions): Promise<Object> {
    if (options) {
      this.options = options;
    }

    this.transport = manager.get('transport');

    return {
      notify: this.notify
    }
  }

  notify (err: Error) {
    return this.transport.send(err)
  }
}