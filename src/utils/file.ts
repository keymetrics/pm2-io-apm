import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export default class FileUtils {
  static writeDumpFile (data, extension?) {
    extension = extension ? extension : '.cpuprofile'

    return new Promise( (resolve, reject) => {
      const cpuDumpFile = path.join(os.tmpdir(), Date.now() + extension)

      fs.writeFile(cpuDumpFile, data, function (err) {
        if (err) {
          return reject(err)
        }

        return resolve(cpuDumpFile)
      })
    })
  }
}
