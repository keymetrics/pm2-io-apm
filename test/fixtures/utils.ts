export default class SpecUtils {
  static getTestDirPath () {
    return './build/main/test/'
  }

  static buildTestPath (path) {
    return this.getTestDirPath() + path
  }

  static buildPath () {
    return './build/'
  }
}
