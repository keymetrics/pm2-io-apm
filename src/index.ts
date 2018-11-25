
import PMX from './pmx'

const IO_KEY = Symbol.for('@pm2/io')
const isAlreadyHere = (Object.getOwnPropertySymbols(global).indexOf(IO_KEY) > -1)

const io: PMX = isAlreadyHere ? global[IO_KEY] as PMX : new PMX().init()
global[IO_KEY] = io

export default io
