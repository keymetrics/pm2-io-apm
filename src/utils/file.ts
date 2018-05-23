import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export default class FileUtils {
  static writeDumpFile (data, extension?) {
    extension = extension ? extension : '.cpuprofile'

    return new Promise((resolve, reject) => {
      const cpuDumpFile = path.join(os.tmpdir(), Date.now() + extension)

      fs.writeFile(cpuDumpFile, data, function (err) {
        if (err) {
          return reject(err)
        }

        return resolve(cpuDumpFile)
      })
    })
  }

  static getFileSize (dumpFile) {
    return new Promise((resolve, reject) => {
      fs.stat(dumpFile, (err, stats) => {
        let fileSizeInMegabytes = 0

        if (err) {
          return reject(err)
        }

        const fileSizeInBytes = stats.size
        // Convert the file size to megabytes
        fileSizeInMegabytes = fileSizeInBytes / 1000000.0

        resolve(fileSizeInMegabytes)
      })
    })
  }
}
