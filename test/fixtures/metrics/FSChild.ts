const io = require(__dirname + '/../../../src/index.js')
import * as fs from 'fs'
import * as async from 'async'

io.init({ metrics: { fileRequests: true } }, true)

function readFile () {
  return function () {
    fs.readFile('./package.json', 'utf8', function myCb (err, contents) {
      if (err) console.log(err)
    })
  }
}

let nbCalls = 10
// try to generate an blocking state in FS
const timer = setInterval(function () {
  const funcs: Array<any> = []
  for (let i = 0; i < nbCalls; i++) funcs.push(readFile())
  async.parallel(funcs)
  nbCalls++
}, 10)

process.on('SIGINT', function () {
  clearInterval(timer)
  io.destroy()
})
