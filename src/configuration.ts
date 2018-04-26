import debug from 'debug'
debug('axm:configuration')

import Transport from './utils/transport'
import Autocast from './utils/autocast'
import * as path from 'path'
import * as fs from 'fs'
import * as util from 'util'

const prefix = __dirname.indexOf('/build/') >= 0 ? '../../../' : '../'
const pkg = require(prefix + '/package.json')

export default class Configuration {

  private transport: Transport

  constructor () {
    this.transport = new Transport()
  }

  configureModule (opts) {
    this.transport.send({
      type : 'axm:option:configuration',
      data : opts
    }, false)
  }

  findPackageJson () {

    require.main = this.getMain()

    if (!require.main) {
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
        return null
      }
      return pkgPath
    }

    return pkgPath
  }

  init (conf, doNotTellPm2?) {
    const packageFilepath = this.findPackageJson()
    let packageJson

    if (!conf.module_conf) {
      conf.module_conf = {}
    }

    /**
     * Merge package.json metadata
     */
    try {
      packageJson = require(packageFilepath || '')

      conf.module_version = packageJson.version
      conf.module_name = packageJson.name
      conf.description = packageJson.description
      conf.pmx_version = null

      if (pkg.version) {
        conf.pmx_version = pkg.version
      }

      if (packageJson.config) {
        conf = util['_extend'](conf, packageJson.config)
        conf.module_conf = packageJson.config
      }
    } catch (e) {
      throw new Error(e)
    }

    /**
     * If custom variables has been set, merge with returned configuration
     */
    try {
      if (process.env[conf.module_name]) {
        const castedConf = new Autocast().autocast(JSON.parse(process.env[conf.module_name] || ''))
        conf = util['_extend'](conf, castedConf)
        // Do not display probe configuration in Keymetrics
        delete castedConf.probes
        // This is the configuration variable modifiable from keymetrics
        conf.module_conf = JSON.parse(JSON.stringify(util['_extend'](conf.module_conf, castedConf)))

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

    this.configureModule(conf)
    return conf
  }

  private getMain (): any {
    return require.main || {filename: './somefile.js'}
  }
}
