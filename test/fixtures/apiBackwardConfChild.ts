
import pmx from '../../src'
let timer
let server

pmx.init({
  metrics: {
    network: true,
    v8: true,
    http: true
  },
  tracing: true,
  profiling: false
})

const express = require('express')
const app = express()

const httpModule = require('http')

app.get('/', function (req, res) {
  res.send('home')
})

server = app.listen(3001, function () {
  timer = setInterval(function () {
    httpModule.get('http://localhost:' + server.address().port)
  }, 100)
})

process.on('SIGINT', function () {
  clearInterval(timer)
  server.close()
  pmx.destroy()
})
