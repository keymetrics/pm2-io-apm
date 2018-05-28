const pmx = require(__dirname + '/../../src/index.js')

const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.get('/error', function (req, res, next) {
  next(new Error('toto'))
})

app.use(pmx.expressErrorHandler())

app.listen(3003, () => {
  if (process && process.send) process.send('expressReady')
})
