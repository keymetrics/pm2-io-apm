
import { NotifyFeature, NotifyOptions } from './notify'
import { ServiceManager } from '../index'

export const features =  [
  {
    name: 'notify',
    module: NotifyFeature
  }
]

export interface Feature {
  init(service: ServiceManager): Object;
}