import Metric from '../../../src/features/metrics'

const metric = new Metric()
metric.init({transaction: {http: {http_latency: 1, ignore_routes: ['/toto']}}}, true)

const httpModule = require('http')

// test http outbound
let timer

const server = httpModule.createServer((req, res) => {
  res.writeHead(200)
  res.end('hey')
}).listen(() => {
  timer = setInterval(function () {
    httpModule.get('http://localhost:' + server.address().port)
    httpModule.get('http://localhost:' + server.address().port + '/toto')
  }, 100)
})

process.on('SIGINT', function () {
  clearInterval(timer)
  server.close()
  metric.destroy()
})
