import TransportService from '../../../src/services/transport'
const transport = new TransportService()
transport.init()
transport.send('test', new Error())