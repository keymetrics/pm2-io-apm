export default class ErrorCallSites {

  static init () {
    const orig = Error.prepareStackTrace
    Error.prepareStackTrace = function (err, callsites) {
      Object.defineProperty(err, '__error_callsites', {
        enumerable: false,
        configurable: true,
        writable: false,
        value: callsites
      })

      return (orig || Object)(err, callsites)
    }
  }

  static getCallSites (err) {
    return err.__error_callsites
  }
}
