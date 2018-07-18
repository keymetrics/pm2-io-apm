import MetricsService from './services/metrics'

const services: {
  metricsMap: Map<string, any>,
  actions: Map<string, any>,
  actionsScoped: Map<string, any>
} = {
  metricsMap: new Map(),
  actions: new Map(),
  actionsScoped: new Map()
}

if (require('semver').satisfies(process.version, '>= 10.0.0') ||
  (require('semver').satisfies(process.version, '>= 8.0.0') && process.env.FORCE_INSPECTOR)) {
  services['inspector'] = require('./services/inspector')
}

export class ServiceManager {

  public static get (type: string) {
    return services[type]
  }

  public static set (type: string, service) {
    services[type] = service
  }

  public static reset (type: string) {
    services[type] = new Map()
  }
}
