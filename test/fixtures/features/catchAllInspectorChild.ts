import { NotifyFeature } from '../../../src/features/notify'
import * as express from 'express'
const app = express()
const http = require('http').Server(app)

function breakApp () {
  throw new Error('test')
}

app.get('/', function (req, res) {
  const toto = 'yolo'
  timer = setTimeout(function () {
    const result = breakApp()
  }, 100)
  res.send('ok')
})

const notify = new NotifyFeature()
const httpModule = require('http')
let timer
let server

notify.init()
server = http.listen(3001, function () {
  httpModule.get('http://localhost:' + server.address().port)
})

process.on('SIGINT', function () {
  clearInterval(timer)
  server.close()
})
