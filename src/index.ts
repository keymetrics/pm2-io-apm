
import PMX from './pmx'
import Entrypoint from './features/entrypoint'

// -----------------------------------
// create a unique, global symbol name
// -----------------------------------

const IO_KEY = Symbol.for('@pm2/io')
const IO_KEY_TMP = Symbol.for('@pm2/io/tmp')

// ------------------------------------------
// check if the global object has this symbol
// add it if it does not have the symbol, yet
// ------------------------------------------

const globalSymbols = Object.getOwnPropertySymbols(global)
const alreadyInstanciated = (globalSymbols.indexOf(IO_KEY) > -1)

if (!alreadyInstanciated) {
  global[IO_KEY] = new PMX()
  global[IO_KEY].Entrypoint = Entrypoint
} else {
  global[IO_KEY_TMP] = {
    io: PMX,
    entrypoint: Entrypoint
  }
}

export = global[IO_KEY]
