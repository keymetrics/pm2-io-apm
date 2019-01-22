
import { ProfilerType } from '../features/profiling'
import Configuration from '../configuration'
import { ServiceManager } from '../serviceManager'
import { Transport } from '../services/transport'
import { ActionService } from '../services/actions'
import MiscUtils from '../utils/miscellaneous'
import { InspectorService } from '../services/inspector'
import * as inspector from 'inspector'
import * as Debug from 'debug'
import * as semver from 'semver'

class CurrentProfile {
  uuid: string
  startTime: number
  initiated: string
}

export default class InspectorProfiler implements ProfilerType {

  private profiler: InspectorService | undefined = undefined
  private actionService: ActionService | undefined
  private transport: Transport | undefined
  private currentProfile: CurrentProfile | null = null
  private logger: Function = Debug('axm:features:profiling:inspector')
  private isNode11: boolean = semver.satisfies(semver.clean(process.version), '>11.x')

  init () {
    this.profiler = ServiceManager.get('inspector')
    if (this.profiler === undefined) {
      Configuration.configureModule({
        heapdump: false,
        'feature.profiler.heap_snapshot': false,
        'feature.profiler.heap_sampling': false,
        'feature.profiler.cpu_js': false
      })
      return console.error(`Failed to require the profiler via inspector, disabling profiling ...`)
    }

    this.profiler.getSession().post('Profiler.enable')
    this.profiler.getSession().post('HeapProfiler.enable')
    this.logger('init')

    this.actionService = ServiceManager.get('actions')
    if (this.actionService === undefined) {
      return this.logger(`Fail to get action service`)
    }
    this.transport = ServiceManager.get('transport')
    if (this.transport === undefined) {
      return this.logger(`Fail to get transport service`)
    }

    Configuration.configureModule({
      heapdump: true,
      'feature.profiler.heapsnapshot': !this.isNode11,
      'feature.profiler.heapsampling': true,
      'feature.profiler.cpu_js': true
    })
    this.register()
  }

  register () {
    if (this.actionService === undefined) {
      return this.logger(`Fail to get action service`)
    }
    this.logger('register')
    this.actionService.registerAction('km:heapdump', this.onHeapdump.bind(this))
    this.actionService.registerAction('km:cpu:profiling:start', this.onCPUProfileStart.bind(this))
    this.actionService.registerAction('km:cpu:profiling:stop', this.onCPUProfileStop.bind(this))
    this.actionService.registerAction('km:heap:sampling:start', this.onHeapProfileStart.bind(this))
    this.actionService.registerAction('km:heap:sampling:stop', this.onHeapProfileStop.bind(this))
  }

  destroy () {
    this.logger('Inspector Profiler destroyed !')
    if (this.profiler === undefined) return
    this.profiler.getSession().post('Profiler.disable')
    this.profiler.getSession().post('HeapProfiler.disable')
  }

  private onHeapProfileStart (opts, cb) {
    if (typeof cb !== 'function') {
      cb = opts
      opts = {}
    }
    if (typeof opts !== 'object' || opts === null) {
      opts = {}
    }

    // not possible but thanks mr typescript
    if (this.profiler === undefined) {
      return cb({
        err: 'Profiler not available',
        success: false
      })
    }

    if (this.currentProfile !== null) {
      return cb({
        err: 'A profiling is already running',
        success: false
      })
    }
    this.currentProfile = new CurrentProfile()
    this.currentProfile.uuid = MiscUtils.generateUUID()
    this.currentProfile.startTime = Date.now()
    this.currentProfile.initiated = typeof opts.initiated === 'string'
      ? opts.initiated : 'manual'

     // run the callback to acknowledge that we received the action
    cb({ success: true, uuid: this.currentProfile.uuid })

    const defaultSamplingInterval = 16384
    this.profiler.getSession().post('HeapProfiler.startSampling', {
      samplingInterval: typeof opts.samplingInterval === 'number'
        ? opts.samplingInterval : defaultSamplingInterval
    })

    if (isNaN(parseInt(opts.timeout, 10))) return
    // if the duration is included, handle that ourselves
    const duration = parseInt(opts.timeout, 10)
    setTimeout(_ => {
      // it will send the profiling itself
      this.onHeapProfileStop(_ => {
        return
      })
    }, duration)
  }

  private onHeapProfileStop (cb) {
    if (this.currentProfile === null) {
      return cb({
        err: 'No profiling are already running',
        success: false
      })
    }
    // not possible but thanks mr typescript
    if (this.profiler === undefined) {
      return cb({
        err: 'Profiler not available',
        success: false
      })
    }

    // run the callback to acknowledge that we received the action
    cb({ success: true, uuid: this.currentProfile.uuid })

    this.profiler.getSession().post('HeapProfiler.stopSampling', (_: Error, { profile }: inspector.HeapProfiler.StopSamplingReturnType) => {
      // not possible but thanks mr typescript
      if (this.currentProfile === null) return
      if (this.transport === undefined) return

      const data = JSON.stringify(profile)

      this.transport.send('profilings', {
        uuid: this.currentProfile.uuid,
        duration: Date.now() - this.currentProfile.startTime,
        at: this.currentProfile.startTime,
        data,
        success: true,
        initiated: this.currentProfile.initiated,
        type: 'heapprofile',
        heapprofile: true
      })
      this.currentProfile = null
    })
  }

  private onCPUProfileStart (opts, cb) {
    if (typeof cb !== 'function') {
      cb = opts
      opts = {}
    }
    if (typeof opts !== 'object' || opts === null) {
      opts = {}
    }
    // not possible but thanks mr typescript
    if (this.profiler === undefined) {
      return cb({
        err: 'Profiler not available',
        success: false
      })
    }

    if (this.currentProfile !== null) {
      return cb({
        err: 'A profiling is already running',
        success: false
      })
    }
    this.currentProfile = new CurrentProfile()
    this.currentProfile.uuid = MiscUtils.generateUUID()
    this.currentProfile.startTime = Date.now()
    this.currentProfile.initiated = typeof opts.initiated === 'string'
      ? opts.initiated : 'manual'

     // run the callback to acknowledge that we received the action
    cb({ success: true, uuid: this.currentProfile.uuid })

    // start the idle time reporter to tell V8 when node is idle
    // See https://github.com/nodejs/node/issues/19009#issuecomment-403161559.
    if (process.hasOwnProperty('_startProfilerIdleNotifier') === true) {
      (process as any)._startProfilerIdleNotifier()
    }

    this.profiler.getSession().post('Profiler.start')

    if (isNaN(parseInt(opts.timeout, 10))) return
    // if the duration is included, handle that ourselves
    const duration = parseInt(opts.timeout, 10)
    setTimeout(_ => {
      // it will send the profiling itself
      this.onCPUProfileStop(_ => {
        return
      })
    }, duration)
  }

  private onCPUProfileStop (cb) {
    if (this.currentProfile === null) {
      return cb({
        err: 'No profiling are already running',
        success: false
      })
    }
    // not possible but thanks mr typescript
    if (this.profiler === undefined) {
      return cb({
        err: 'Profiler not available',
        success: false
      })
    }

    // run the callback to acknowledge that we received the action
    cb({ success: true, uuid: this.currentProfile.uuid })

    // stop the idle time reporter to tell V8 when node is idle
    // See https://github.com/nodejs/node/issues/19009#issuecomment-403161559.
    if (process.hasOwnProperty('_stopProfilerIdleNotifier') === true) {
      (process as any)._stopProfilerIdleNotifier()
    }

    this.profiler.getSession().post('Profiler.stop', (_: Error, res: any) => {
      // not possible but thanks mr typescript
      if (this.currentProfile === null) return
      if (this.transport === undefined) return

      const profile: inspector.Profiler.Profile = res.profile
      const data = JSON.stringify(profile)

      // send the profile to the transporter
      this.transport.send('profilings', {
        uuid: this.currentProfile.uuid,
        duration: Date.now() - this.currentProfile.startTime,
        at: this.currentProfile.startTime,
        data,
        success: true,
        initiated: this.currentProfile.initiated,
        type: 'cpuprofile',
        cpuprofile: true
      })
      this.currentProfile = null
    })
  }

  /**
   * Custom action implementation to make a heap snapshot
   */
  private onHeapdump (opts, cb) {
    if (typeof cb !== 'function') {
      cb = opts
      opts = {}
    }
    if (typeof opts !== 'object' || opts === null) {
      opts = {}
    }
    // not possible but thanks mr typescript
    if (this.profiler === undefined) {
      return cb({
        err: 'Profiler not available',
        success: false
      })
    }

    // run the callback to acknowledge that we received the action
    cb({ success: true })

    // wait few ms to be sure we sended the ACK because the snapshot stop the world
    setTimeout(() => {
      const startTime = Date.now()
      this.takeSnapshot()
        .then(data => {
          // @ts-ignore thanks mr typescript but its not possible
          return this.transport.send('profilings', {
            data,
            at: startTime,
            initiated: typeof opts.initiated === 'string' ? opts.initiated : 'manual',
            duration: Date.now() - startTime,
            type: 'heapdump'
          })
        }).catch(err => {
          return cb({
            success: err.message,
            err: err
          })
        })
    }, 200)
  }

  takeSnapshot () {
    return new Promise(async (resolve, reject) => {
      // not possible but thanks mr typescript
      if (this.profiler === undefined) return reject(new Error(`Profiler not available`))

      const chunks: Array<string> = []
      const chunkHandler = (raw: any) => {
        const data = raw.params as inspector.HeapProfiler.AddHeapSnapshotChunkEventDataType
        chunks.push(data.chunk)
      }
      this.profiler.getSession().on('HeapProfiler.addHeapSnapshotChunk', chunkHandler)
      // tslint:disable-next-line
      await this.profiler.getSession().post('HeapProfiler.takeHeapSnapshot', {
        reportProgress: false
      })
      // remove the listeners
      this.profiler.getSession().removeListener('HeapProfiler.addHeapSnapshotChunk', chunkHandler)
      return resolve(chunks.join(''))
    })
  }
}
