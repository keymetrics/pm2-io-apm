
import { canUseInspector } from './constants'

const services: Map<string, any> = new Map<string, any>()

if (canUseInspector()) {
  const Inspector = require('./services/inspector')
  services.set('inspector', new Inspector())
}

export class Service {}

export class ServiceManager {

  public static get (serviceName: string) : any | undefined {
    return services.get(serviceName)
  }

  public static set (serviceName: string, service: Service) {
    return services.set(serviceName, service)
  }

  public static reset (serviceName: string) {
    return services.delete(serviceName)
  }
}
