import pmx from '../../../src'
pmx.init({
  metrics: {
    eventLoopActive: true,
    eventLoopDelay: true,
    v8: {
      GC: true
    }
  },
  network: true
})

const q = 'tasks'
let timer

function bail (err) {
  console.error(err)
  process.exit(1)
}

// Publisher
function publisher (conn) {
  timer = setInterval(function () {
    conn.createChannel(on_open)
  }, 100)

  function on_open (err, ch) {
    if (err != null) bail(err)
    ch.assertQueue(q)
    ch.sendToQueue(q, new Buffer('something to do'))
  }
}

// Consumer
function consumer (conn) {
  conn.createChannel(on_open)
  function on_open (err, ch) {
    if (err != null) bail(err)
    ch.assertQueue(q)
    ch.consume(q, function (msg) {
      if (msg !== null) {
        ch.ack(msg)
      }
    })
  }
}

require('amqplib/callback_api')
  .connect('amqp://localhost', function (err, conn) {
    if (err != null) bail(err)
    consumer(conn)
    publisher(conn)
    process.once('SIGINT', function () {
      clearInterval(timer)
      conn.close()
    })
  })
