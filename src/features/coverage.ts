import { Feature } from './featureTypes'
import { InspectorService } from '../services/inspector'
import { ServiceManager } from '../serviceManager'
import FileUtils from '../utils/file'

import Debug from 'debug'
const debug = Debug('axm:coveragefeature')

export default class CoverageFeature implements Feature {

  private inspectorService: InspectorService
  private method: string

  constructor () {
    this.inspectorService = ServiceManager.get('inspector')
  }

  init () {
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
    return FileUtils.writeDumpFile(JSON.stringify(data), '.coverageprofile')
  }

  private getInfo () {
    const self = this
    return new Promise(async (resolve, reject) => {
      try {
        const data = await this.inspectorService.post('Profiler.' + self.method)
        await this.inspectorService.post('Profiler.stopPreciseCoverage')

        return resolve(data)

      } catch (err) {
        debug('Coverage profiling stopped !', err)
        return reject(err)
      }
    })
  }
}
