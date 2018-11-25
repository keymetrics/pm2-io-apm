
import pmx from '../../src'

pmx.scopedAction('testScopedAction', function (opts, res) { res.send('testScopedActionReply') })

process.on('SIGINT', function () {
  pmx.destroy()
})
