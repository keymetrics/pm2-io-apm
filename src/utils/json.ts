export default class JsonUtils {
  static jsonize (err) {
    if (typeof(err) !== 'object') {
      return err
    }

    const plainObject = {}

    Object.getOwnPropertyNames(err).forEach(function (key) {
      plainObject[key] = err[key]
    })

    return plainObject
  }
}
