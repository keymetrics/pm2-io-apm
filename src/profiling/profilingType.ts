
import * as inspector from 'inspector'

export default interface ProfilingType {
  init (): void
  start (): void
  stop (): void
  destroy (): void
}

export interface CustomProfileNode extends inspector.Profiler.ProfileNode {
    callUID: number
}

export interface CustomProfile extends inspector.Profiler.Profile {
  nodes: CustomProfileNode[];
}