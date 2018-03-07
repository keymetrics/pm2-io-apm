import { test } from 'ava'
import { fork } from 'child_process'

test.cb('[Notify] should send a notification', t => {
  const child = fork('./build/main/test/fixtures/features/notifyChild.js')
  child.on('message', msg => {
    t.deepEqual(msg, 'test')
    t.end()
  })
})
