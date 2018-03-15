import * as fs from 'fs'
import * as debug from 'debug'
debug('axm:profiling')
import * as path from 'path'

export default class ModuleUtils {
  static detectModule (moduleName, cb) {
    const module = require.main || {paths: ['./node_modules', '/node_modules']}

    const requirePaths = module.paths.slice()

    ModuleUtils._lookForModule(requirePaths, moduleName, cb)
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
