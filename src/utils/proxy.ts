import debug from 'debug'
debug('axm:proxy')

export default class Proxy {
  static wrap (object, methods, hook) {

    if (!Array.isArray(methods)) methods = [methods]

    for (let i = 0; i < methods.length; ++i) {
      debug('Wrapping method:', methods[i])
      const original = object[methods[i]]

      if (!original) return debug('Method %s unknown', methods[i])

      if (original.__axm_original) {
        debug('Already wrapped', methods[i])
        if (methods[i] !== '_load') {
          return
        }
      }

      const hooked = hook(original)

      if (original.__axm_original) {
        hooked.__axm_original = original.__axm_original
      } else {
        hooked.__axm_original = original
      }
      object[methods[i]] = hooked
    }
  }
}
