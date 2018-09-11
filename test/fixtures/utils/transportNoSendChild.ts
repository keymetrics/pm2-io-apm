import TransportService from '../../../src/services/transport'
const transport = new TransportService()
transport.init()

const old = process.send
delete process.send
const res = transport.send('test', new Error())

process.send = old

if (process.send) {
  process.send(res)
}

process.exit(0)
