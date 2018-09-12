import { Feature } from './featureTypes'
import { InspectorService } from '../services/inspector'
import { ServiceManager } from '../serviceManager'
import * as semver from 'semver'

import Debug from 'debug'
const debug = Debug('axm:coveragefeature')

export default class CoverageFeature implements Feature {

  private inspectorService: InspectorService
  private method: string

  constructor () {
    this.inspectorService = ServiceManager.get('inspector')
  }

  init () {
    if (semver.satisfies(process.version, '< 8.0.0') ||
      (semver.satisfies(process.version, '< 10.0.0') && !process.env.FORCE_INSPECTOR)) {
      return new Promise(resolve => {
        debug(`Coverage feature is not available for node < 8.0.0 (force inspector : ${process.env.FORCE_INSPECTOR}), current version ${process.version}`)
        resolve(`Coverage feature is not available for node < 8.0.0 (force inspector : ${process.env.FORCE_INSPECTOR}), current version ${process.version}`)
      })
    }

    this.inspectorService.createSession()
    this.inspectorService.connect()
    return this.inspectorService.post('Profiler.enable')
  }

  destroy () {
    this.inspectorService.disconnect()
  }

  start (opts) {
    this.method = !opts.method ? 'takePreciseCoverage' : opts.method

    return this.inspectorService.post('Profiler.startPreciseCoverage', { callCount: !!opts.callCount, detailed : !!opts.detailed })
  }

  async stop () {
    const data = await this.getInfo()
    return JSON.stringify(data)
  }

  private getInfo () {
    // const self = this
    return new Promise(async (resolve, reject) => {
      try {
        const data = await this.inspectorService.post('Profiler.' + this.method)
        await this.inspectorService.post('Profiler.stopPreciseCoverage')

        return resolve(data)

      } catch (err) {
        debug('Coverage profiling stopped !', err)
        return reject(err)
      }
    })
  }
}
