import Transport from '../../../src/utils/transport'

const old = process.send
delete process.send
const res = Transport.send(new Error())

process.send = old

if (process.send) {
  process.send(res)
}

process.exit(0)
