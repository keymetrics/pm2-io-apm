import Metric from '../../../src/features/metrics'
const metric = new Metric()
metric.init({transaction: {tracing: {http_latency: 1, ignore_routes: ['/toto']}}}, true)

import * as express from 'express'
const app = express()

const httpModule = require('http')

// test http outbound
let timer

app.get('/', function (req, res) {
  res.send('home')
})

app.get('/toto', function (req, res) {
  res.send('toto')
})

const server = app.listen(3001, function () {
  timer = setTimeout(function () {
    httpModule.get('http://localhost:' + server.address().port)
    httpModule.get('http://localhost:' + server.address().port + '/toto')
  }, 200)
})

process.on('SIGINT', function () {
  clearInterval(timer)
  server.close()
  metric.destroy()
})
