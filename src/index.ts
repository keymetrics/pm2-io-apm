import Transport from './utils/transport'

const services: { transport: Transport; metricsMap: Map<string, any> } = { transport: new Transport(), metricsMap: new Map() }

export class ServiceManager {

  public static get (type: string) {
    return services[type]
  }
}
