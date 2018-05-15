import Debug from 'debug'
const debug = Debug('axm:profiling')
import ProfilingType from './profilingType'
import { CustomProfile } from './profilingType'
import FileUtils from '../utils/file'
import { ServiceManager } from '../serviceManager'
import { InspectorService } from '../services/inspector'

export default class ProfilingCPU implements ProfilingType {

  private inspectorService: InspectorService

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

  start () {
    return this.inspectorService.post('Profiler.start')
  }

  async stop () {
    return await this.getProfileInfo()
  }

  private _convertTimeDeltas (profile: CustomProfile) {
    if (!profile.timeDeltas) return null
    let lastTimeUsec = profile.startTime
    const timestamps = new Array(profile.timeDeltas.length + 1)
    for (let i = 0; i < profile.timeDeltas.length; ++i) {
      timestamps[i] = lastTimeUsec
      lastTimeUsec += profile.timeDeltas[i]
    }
    timestamps[profile.timeDeltas.length] = lastTimeUsec
    return timestamps
  }

  private getProfileInfo () {
    return new Promise( async (resolve, reject) => {
      try {
        let rawData: any = await this.inspectorService.post('Profiler.stop')

        if (!rawData || !rawData.profile) return reject(`V8 Interval Error`)
        rawData = rawData.profile

        let data: CustomProfile = rawData as CustomProfile

        // recursively reformat the flatten tree into an actual tree
        const reformatNode = node => {
          if (!node.children) node.children = []

          node.children = node.children.map(childID => {
            if (typeof childID !== 'number') return childID
            const childNode = data.nodes.find(node => node.id === childID)
            if (typeof childNode !== 'object') return null
            childNode.callUID = node.id
            return childNode
          })
          return {
            functionName: node.callFrame.functionName,
            url: node.callFrame.url,
            lineNumber: node.callFrame.lineNumber,
            callUID: node.callUID,
            bailoutReason: '',
            id: node.id,
            scriptId: 0,
            hitCount: node.hitCount,
            children: node.children.map(reformatNode)
          }
        }

        // reformat then only keep the root as top level node
        const nodes = data.nodes
          .map(reformatNode)
          .filter(node => node.functionName === '(root)' )[0]

        // since it can be undefined, create an array so execution still works
        if (!data.timeDeltas) {
          data.timeDeltas = []
        }

        return resolve(FileUtils.writeDumpFile(JSON.stringify({
          head: nodes,
          typeId: 'CPU',
          uid: '1',
          startTime: Math.floor(data.startTime / 1000000),
          title: 'km-cpu-profiling',
          endTime: Math.floor(data.endTime / 1000000),
          samples: data.samples,
          timestamps: this._convertTimeDeltas(data)
        })))

      } catch (err) {
        debug('Cpu profiling stopped !')
        return reject(err)
      }
    })
  }
}
