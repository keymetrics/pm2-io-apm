import Debug from 'debug'
const debug = Debug('axm:coverageaction')

import ActionsFeature from '../features/actions'
import CoverageFeature from '../features/coverage'
import ActionsInterface from './actionsInterface'
import MiscUtils from '../utils/miscellaneous'
import { ServiceManager } from '../serviceManager'
import FileUtils from '../utils/file'

export default class CoverageAction implements ActionsInterface {

  private actionFeature: ActionsFeature
  private coverageFeature: CoverageFeature
  private uuid: string

  constructor (actionFeature: ActionsFeature) {
    this.actionFeature = actionFeature
  }

  async init () {
    this.coverageFeature = new CoverageFeature()

    try {
      await this.coverageFeature.init()
      // expose actions only if the feature is available
      this.exposeActions()
    } catch (err) {
      debug(`Failed to load coverage profiler: ${err.message}`)
    }
  }

  destroy () {
    if (this.coverageFeature) this.coverageFeature.destroy()
  }

  private async stopCoverage (reply) {
    try {
      const dumpFile = await this.coverageFeature.stop()

      let size
      try {
        size = await FileUtils.getFileSize(dumpFile)
      } catch (err) {
        size = -1
      }

      return reply({
        success     : true,
        coverage    : true,
        dump_file   : dumpFile,
        dump_file_size : size,
        uuid        : this.uuid
      })
    } catch (err) {
      return reply({
        success : false,
        err     : err,
        uuid    : this.uuid
      })
    }
  }

  private exposeActions () {

    this.actionFeature.action('km:coverage:start', async (opts, reply) => {
      if (!reply) {
        reply = opts
        opts = {}
      }

      try {
        this.uuid = MiscUtils.generateUUID()
        await this.coverageFeature.start(opts)
        reply({ success : true, uuid: this.uuid })

        if (opts.timeout && typeof opts.timeout === 'number') {
          setTimeout(async _ => {
            const reply = (data) => ServiceManager.get('transport').send('axm:reply', {
              return: data,
              action_name: 'km:coverage:stop'
            })
            await this.stopCoverage(reply)
          }, opts.timeout)
        }
      } catch (err) {
        return reply({
          success : false,
          err     : err,
          uuid    : this.uuid
        })
      }
    })

    this.actionFeature.action('km:coverage:stop', this.stopCoverage.bind(this))
  }
}
