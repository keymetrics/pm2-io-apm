
import PMX from './pmx'
import Entrypoint from './features/entrypoint'

const IO_KEY = Symbol.for('@pm2/io')
const isAlreadyHere = (Object.getOwnPropertySymbols(global).indexOf(IO_KEY) > -1)

const io: PMX = isAlreadyHere ? global[IO_KEY] as PMX : new PMX().init()
// @ts-ignore
io.Entrypoint = Entrypoint
global[IO_KEY] = io

export default io
