import { ServiceManager } from '../serviceManager'

export default class MiscUtils {
  static generateUUID (): string {
    return Math.random().toString(36).substr(2, 16)
  }

  static getValueFromDump (property, parentProperty = 'handles'): number {
    const dump = ServiceManager.get('eventLoopService').inspector.dump()
    return dump[parentProperty].hasOwnProperty(property) ? dump[parentProperty][property].length : 0
  }
}
