import SpecUtils from './utils'

const pmx = require(__dirname + '/../../src/index.js')
let timer
let server

pmx.init({
  network: true,
  ports: true,
  v8: true,
  transactions: {http_latency: 1},
  http: true,
  deep_metrics: true
}).then(() => {
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
})

process.on('SIGINT', function () {
  clearInterval(timer)
  server.close()
  pmx.destroy()
})
