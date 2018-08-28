
import PMX from './pmx'
import Entrypoint from './features/entrypoint'

// -----------------------------------
// create a unique, global symbol name
// -----------------------------------

const IO_KEY = Symbol.for('@pm2/io')

// ------------------------------------------
// check if the global object has this symbol
// add it if it does not have the symbol, yet
// ------------------------------------------

const globalSymbols = Object.getOwnPropertySymbols(global)
const alreadyInstanciated = (globalSymbols.indexOf(IO_KEY) > -1)

let conf
if (alreadyInstanciated) {
  conf = global[IO_KEY].getInitialConfig()
  global[IO_KEY].destroy()
}

global[IO_KEY] = new PMX()
global[IO_KEY].setInitialConfig(conf)
global[IO_KEY].Entrypoint = Entrypoint

export = global[IO_KEY]
