import Metric from '../../../src/features/metrics'

const metric = new Metric()
metric.init({network: {ports: true}}, true)

const httpModule = require('http')

let timer

const server = httpModule.createServer((req, res) => {
  res.writeHead(200)
  res.end('hey')
}).listen(3002, () => {
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
