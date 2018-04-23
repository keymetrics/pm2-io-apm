export default class MiscUtils {
  static generateUUID (): string {
    return Math.random().toString(36).substr(2, 16)
  }
}
