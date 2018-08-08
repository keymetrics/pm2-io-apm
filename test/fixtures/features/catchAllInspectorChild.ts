'use strict'

import { NotifyFeature } from '../../../src/features/notify'

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
