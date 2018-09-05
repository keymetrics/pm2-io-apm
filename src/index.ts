
import PMX from './pmx'
import Entrypoint from './features/entrypoint'

var io
io = new PMX()
io.init()
io.Entrypoint = Entrypoint

export = io
