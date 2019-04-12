import { ServiceManager } from '../serviceManager'
import * as Debug from 'debug'
import { Feature } from '../featureManager'
import { Transport } from '../services/transport'
import Configuration from '../configuration'
import { readFile } from 'fs'

type PkgDependencies = { [name: string]: string }
type DependencyList = { [name: string]: { version: string }}

export class DependenciesFeature implements Feature {

  private transport: Transport
  private logger: Function = Debug('axm:features:dependencies')

  init (): void {
    this.transport = ServiceManager.get('transport')
    this.logger('init')

    const pkgPath = Configuration.findPackageJson()
    if (typeof pkgPath !== 'string') return this.logger('failed to found pkg.json path')

    this.logger(`found pkg.json in ${pkgPath}`)
    readFile(pkgPath, (err, data) => {
      if (err) return this.logger(`failed to read pkg.json`, err)
      try {
        const pkg = JSON.parse(data.toString())
        if (typeof pkg.dependencies !== 'object') {
          return this.logger(`failed to find deps in pkg.json`)
        }
        const dependencies = Object.keys(pkg.dependencies as PkgDependencies)
          .reduce((list: DependencyList, name: string) => {
            list[name] = { version: pkg.dependencies[name] }
            return list
          }, {} as DependencyList)
        this.logger(`collected ${Object.keys(dependencies).length} dependencies`)
        this.transport.send('application:dependencies', dependencies)
        this.logger('sent dependencies list')
      } catch (err) {
        return this.logger(`failed to parse pkg.json`, err)
      }
    })
  }

  destroy () {
    this.logger('destroy')
  }
}
