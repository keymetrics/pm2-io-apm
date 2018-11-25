
const services: Map<string, any> = new Map<string, any>()

export class Service {}

export class ServiceManager {

  public static get (serviceName: string): any | undefined {
    return services.get(serviceName)
  }

  public static set (serviceName: string, service: Service) {
    return services.set(serviceName, service)
  }

  public static reset (serviceName: string) {
    return services.delete(serviceName)
  }
}
