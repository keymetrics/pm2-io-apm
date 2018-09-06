
import PMX from './pmx'
import Entrypoint from './features/entrypoint'

//let io: PMX
var io

if (process.env.PMX_FORCE_UPDATE) {
  io = new PMX()
  io.init()
  io.Entrypoint = Entrypoint
}
else {
  // -----------------------------------
  // create a unique, global symbol name
  // -----------------------------------
  const IO_KEY = Symbol.for('@pm2/io')

  // ------------------------------------------
  // check if the global object has this symbol
  // add it if it does not have the symbol, yet
  // ------------------------------------------
  const globalSymbols = Object.getOwnPropertySymbols(global)
  const hasKey = (globalSymbols.indexOf(IO_KEY) > -1)

  if (!hasKey) {
    io = global[IO_KEY] = new PMX()
  }

  if (!hasKey) {
    global[IO_KEY].Entrypoint = Entrypoint

    // Freeze API, cannot be modified
    //Object.freeze(global[IO_KEY])
  }

  io = global[IO_KEY]
}

export = io
