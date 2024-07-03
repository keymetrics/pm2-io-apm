import Debug from 'debug'
const debug = Debug('axm:configuration')

import { ServiceManager } from './serviceManager'
import Autocast from './utils/autocast'
import * as path from 'path'
import * as fs from 'fs'

export default class Configuration {

  static configureModule (opts) {
    if (ServiceManager.get('transport')) ServiceManager.get('transport').setOptions(opts)
  }

  static findPackageJson () {
    try {
      require.main = Configuration.getMain()
    } catch (_e) {
      // Ignore error when getter is set on require.main, but no setter
    }

    if (!require.main) {
      return
    }

    if (!require.main.paths) {
      return
    }

    let pkgPath = path.resolve(path.dirname(require.main.filename), 'package.json')
    try {
      fs.statSync(pkgPath)
    } catch (e) {
      try {
        pkgPath = path.resolve(path.dirname(require.main.filename), '..', 'package.json')
        fs.statSync(pkgPath)
      } catch (e) {
        debug('Cannot find package.json')
        try {
          pkgPath = path.resolve(path.dirname(require.main.filename), '..', '..', 'package.json')
          fs.statSync(pkgPath)
        } catch (e) {
          debug('Cannot find package.json')
          return null
        }
      }
      return pkgPath
    }

    return pkgPath
  }

  static init (conf, doNotTellPm2?) {
    const packageFilepath = Configuration.findPackageJson()
    let packageJson

    if (!conf.module_conf) {
      conf.module_conf = {}
    }
    conf.apm = {
      type: 'node',
      version: null
    }

    try {
      const prefix = __dirname.replace(/\\/g,'/').indexOf('/build/') >= 0 ? '../../' : '../'
      const pkg = require(prefix + 'package.json')
      conf.apm.version = pkg.version || null
    } catch (err) {
      debug('Failed to fetch current apm version: ', err.message)
    }

    if (conf.isModule === true) {
      /**
       * Merge package.json metadata
       */
      try {
        packageJson = require(packageFilepath || '')

        conf.module_version = packageJson.version
        conf.module_name = packageJson.name
        conf.description = packageJson.description

        if (packageJson.config) {
          conf = Object.assign(conf, packageJson.config)
          conf.module_conf = packageJson.config
        }
      } catch (e) {
        throw new Error(e)
      }
    } else {
      conf.module_name = process.env.name || 'outside-pm2'
      try {
        packageJson = require(packageFilepath || '')

        conf.module_version = packageJson.version

        if (packageJson.config) {
          conf = Object.assign(conf, packageJson.config)
          conf.module_conf = packageJson.config
        }
      } catch (e) {
        debug(e.message)
      }
    }

    /**
     * If custom variables has been set, merge with returned configuration
     */
    try {
      if (process.env[conf.module_name]) {
        const castedConf = new Autocast().autocast(JSON.parse(process.env[conf.module_name] || ''))
        conf = Object.assign(conf, castedConf)
        // Do not display probe configuration in Keymetrics
        delete castedConf.probes
        // This is the configuration variable modifiable from keymetrics
        conf.module_conf = JSON.parse(JSON.stringify(Object.assign(conf.module_conf, castedConf)))

        // Obfuscate passwords
        Object.keys(conf.module_conf).forEach(function (key) {
          if ((key === 'password' || key === 'passwd') &&
            conf.module_conf[key].length >= 1) {
            conf.module_conf[key] = 'Password hidden'
          }

        })
      }
    } catch (e) {
      debug(e)
    }

    if (doNotTellPm2 === true) return conf

    Configuration.configureModule(conf)
    return conf
  }

  static getMain (): any {
    return require.main || { filename: './somefile.js' }
  }
}
