var io = require('@pm2/io')

var agent = io.init({
  standalone: true,
  metrics: {
    eventLoop: false,
    http: false,
    v8: false
  },
  apmOptions: {
    publicKey: '<public>',
    secretKey: '<secret>',
    appName: 'toto'
  }
})

var val = agent.metrics({
  name: 'Value Report'
})

var i = 0

setInterval(() => {
  val.set(i++)
}, 900)
