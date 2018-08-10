import Action from '../../../src/features/actions'
import CoverageAction from '../../../src/actions/coverage'

const action = new Action()

function func () {
  console.log('func')
}

const coverage = new CoverageAction(action)
let timer
coverage.init().then(() => {
  if (process && process.send) {
    process.send('initialized')
  }

  timer = setTimeout(function mytimeout () {
    // should run
    func()

    // should not be run
    // so coverage (with block coverage granularity) should see it
    if (process.send && process.send.length === 0) {
      func()
    }
  }, 500)
})

process.on('SIGINT', function () {
  coverage.destroy()
  clearTimeout(timer)
  action.destroy()
})
