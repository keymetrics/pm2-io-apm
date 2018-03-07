import Transport from './utils/transport'

const services: { transport: Transport; } = { transport: new Transport() }

export class ServiceManager {

  public static get (type: string) {
    return services[type]
  }
}
