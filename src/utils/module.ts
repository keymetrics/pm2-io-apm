import * as fs from 'fs'
import * as debug from 'debug'
import * as path from 'path'

debug('axm:module')

export default class ModuleUtils {
  static async getModulePath (moduleName) {
    return new Promise( (resolve, reject) => {
      ModuleUtils.detectModule(moduleName, (err, path) => {

        if (err) {
          debug(err)
          return reject(err)
        }

        return resolve(path)
      })
    })
  }

  static loadModule (modulePath, moduleName, args?) {
    let module
    try {
      if (args) {
        module = require(modulePath).apply(this, args)
      } else {
        module = require(modulePath)
      }
    } catch (e) {
      debug(`Error when requiring ${moduleName} on path`, modulePath)
      debug(e)
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

    fs.access(profilerPath, (fs.constants || fs).R_OK, function (err) {
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
