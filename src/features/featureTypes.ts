
import { NotifyFeature } from './notify'

export const features = [
  {
    name: 'notify',
    module: NotifyFeature
  }
]

export interface Feature {
  init (): Object
}
