import Transport from '../../../src/utils/transport'

const transport = new Transport()
const old = process.send
delete process.send
const res = transport.send(new Error())

process.send = old

if (process.send) {
  process.send(res)
}

process.exit(0)
