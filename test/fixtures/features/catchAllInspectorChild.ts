'use strict'

import { NotifyFeature } from '../../../src/features/notify'
import TransportService from '../../../src/services/transport'
import { ServiceManager } from '../../../src/serviceManager'

const transport = new TransportService()
transport.init()
ServiceManager.set('transport', transport)

const http = require('http').Server((req, res) => {
  const toto = 'yolo'
  // send doesnt exist
  res.send('ok')
})

const notify = new NotifyFeature()
const httpModule = require('http')
let server

notify.init()
server = http.listen(3001, function () {
  httpModule.get('http://localhost:' + server.address().port)
})

process.on('SIGINT', function () {
  notify.destroy()
  server.close()
})
