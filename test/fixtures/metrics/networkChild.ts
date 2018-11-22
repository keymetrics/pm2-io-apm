import Metric from '../../services/metrics'
import TransportService from '../../services/transport'
import { ServiceManager } from '../../serviceManager'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const metric = new Metric()
metric.init({ network: { ports: true } }, true)

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
