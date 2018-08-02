const io = require(__dirname + '/../../../src/index.js')
import {fork, ChildProcess} from 'child_process'

io.init({metrics: {worker: true}}, true)

const children: Array<ChildProcess> = []
children.push(fork(__dirname + '/workerFork.js'))
children.push(fork(__dirname + '/workerFork.js'))

process.on('SIGINT', function () {
  children[0].kill()
  children[1].kill()
  io.destroy()
})
