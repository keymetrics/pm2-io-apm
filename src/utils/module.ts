import * as fs from 'fs'
import * as debug from 'debug'
import * as path from 'path'

debug('axm:module')

export default class ModuleUtils {
  static loadModule (modulePath, moduleName) {
    let module
    try {
      module = require(modulePath)(true)
    } catch (e) {
      console.error(`Error when requiring ${moduleName} on path`, modulePath)
      console.error(e)
      return e
    }

    debug(`${moduleName} successfully enabled` )

    return module
  }

  static detectModule (moduleName, cb) {
    const module = this._getModule() || {paths: ['./node_modules', '/node_modules']}

    const requirePaths = module.paths.slice()

    ModuleUtils._lookForModule(requirePaths, moduleName, cb)
  }

  static _getModule (): any {
    return require.main
  }

  static _lookForModule (requirePaths, moduleName, cb) {
    if (!requirePaths[0]) {
      debug('[x] %s NOT FOUND', moduleName)
      return cb(new Error(moduleName + ' not found'))
    }
    const profilerPath = path.join(requirePaths[0], moduleName)

    debug('Checking %s in path %s', moduleName, profilerPath)

    fs.access(profilerPath, fs.constants.R_OK, function (err) {
      if (!err) {
        debug('[+] %s detected in path %s', moduleName, profilerPath)
        return cb(null, profilerPath)
      }

      debug('[-] %s not found in path %s', moduleName, profilerPath)
      requirePaths.shift()
      return ModuleUtils._lookForModule(requirePaths, moduleName, cb)
    })
  }
}
