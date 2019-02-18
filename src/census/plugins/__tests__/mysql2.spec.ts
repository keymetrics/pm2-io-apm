import { CoreTracer, RootSpan, SpanEventListener, logger } from '@pm2/opencensus-core'
import * as assert from 'assert'
import * as mysql from 'mysql2'
import * as path from 'path'

import { plugin } from '../mysql2'

/** Collects ended root spans to allow for later analysis. */
class RootSpanVerifier implements SpanEventListener {
  endedRootSpans: RootSpan[] = []

  onStartSpan (span: RootSpan): void {
    return
  }
  onEndSpan (root: RootSpan) {
    this.endedRootSpans.push(root)
  }
}

/**
 * Access the mysql database.
 * @param url The mysql URL to access.
 */
function connectConnection (url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const server = new mysql.createConnection(url)
    server.connect(err => {
      if (err) return reject(err)
      resolve(server)
    })
  })
}

function createPool (url: string): any {
  return new mysql.createPool(url)
}

/**
 * Asserts root spans attributes.
 * @param rootSpanVerifier An instance of rootSpanVerifier to analyse RootSpan
 * instances from.
 * @param expectedName The expected name of the first root span.
 * @param expectedKind The expected kind of the first root span.
 */
function assertSpan (
  rootSpanVerifier: RootSpanVerifier, expectedName: string,
  expectedKind: string) {
assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans.length, 1)
assert.strictEqual(
    rootSpanVerifier.endedRootSpans[0].spans[0].name, expectedName)
assert.strictEqual(
    rootSpanVerifier.endedRootSpans[0].spans[0].kind, expectedKind)
}

describe('Mysql2Plugin', () => {
  // For these tests, mysql must be runing. Add OPENCENSUS_MYSQL_TESTS to run
  // these tests.
  const OPENCENSUS_MYSQL_TESTS =
      process.env.OPENCENSUS_MYSQL_TESTS as string
  const OPENCENSUS_MYSQL_HOST =
      process.env.OPENCENSUS_MYSQL_HOST as string
  const OPENCENSUS_MYSQL_DATABASE =
      process.env.OPENCENSUS_MYSQL_DATABASE as string
  const OPENCENSUS_MYSQL_USER =
      process.env.OPENCENSUS_MYSQL_USER as string
  const OPENCENSUS_MYSQL_PASSWORD =
      process.env.OPENCENSUS_MYSQL_PASSWORD as string
  let shouldTest = true
  if (!OPENCENSUS_MYSQL_TESTS) {
    console.log('Skipping test-mysql2. Run Mysql to test')
    shouldTest = false
  }

  const URL = `mysql://${OPENCENSUS_MYSQL_USER || 'root'}:${OPENCENSUS_MYSQL_PASSWORD || 'password'}@${OPENCENSUS_MYSQL_HOST || 'localhost'}/${OPENCENSUS_MYSQL_DATABASE || 'test'}`
  const VERSION = '3.1.13'

  const tracer = new CoreTracer()
  const rootSpanVerifier = new RootSpanVerifier()
  let client: any
  let pool: any

  before((done) => {
    tracer.start({ samplingRate: 1, logger: logger.logger(4) })
    tracer.registerSpanEventListener(rootSpanVerifier)
    const basedir = path.dirname(require.resolve('mysql2'))
    plugin.enable(mysql, tracer, VERSION, {}, basedir)
    connectConnection(URL)
      .then(server => {
        client = server
        pool = createPool(URL)
        done()
      })
      .catch((err: Error) => {
        console.log(
            'Skipping test-mysql2. Could not connect. Run Mysql to test', err)
        shouldTest = false
        done()
      })
  })

  beforeEach(function mysqlBeforeEach (done) {
    // Skiping all tests in beforeEach() is a workarround. Mocha does not work
    // properly when skiping tests in before() on nested describe() calls.
    // https://github.com/mochajs/mocha/issues/2819
    if (!shouldTest) {
      this.skip()
    }
    rootSpanVerifier.endedRootSpans = []
    done()
  })

  after(() => {
    if (client) {
      client.destroy()
    }
  })

  /** Should intercept query */
  describe('Instrumenting connection operations', () => {
    it('should create a child span for select', done => {
      tracer.startRootSpan({ name: 'selectRootSpan' }, (rootSpan: RootSpan) => {
        const q = 'SELECT 1'
        client.query(q, (err, result) => {
          assert.strictEqual(result[0]['1'], 1)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.ifError(err)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans.length, 1)
          assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans[0].attributes.sql, q)
          assertSpan(rootSpanVerifier, 'mysql-query', 'MYSQL')
          done()
        })
      })
    })

    it('should create a child span for errored query', done => {
      tracer.startRootSpan({ name: 'errorRootSpan' }, (rootSpan: RootSpan) => {
        const q = 'SELECT * FROM notexisttable'
        client.query(q, (err, result) => {
          assert.ok(err instanceof Error)
          assert.strictEqual(err.code, 'ER_NO_SUCH_TABLE')
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans.length, 1)
          assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans[0].attributes.sql, q)
          assertSpan(rootSpanVerifier, 'mysql-query', 'MYSQL')
          done()
        })
      })
    })
  })

  describe('instrumenting pool operations', () => {
    it('should create a child span for select', done => {
      tracer.startRootSpan({ name: 'selectRootSpan' }, (rootSpan: RootSpan) => {
        const q = 'SELECT 1'
        pool.getConnection((err, conn) => {
          assert.ifError(err)
          conn.query(q, (err, result) => {
            assert.strictEqual(result[0]['1'], 1)
            assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
            rootSpan.end()
            assert.ifError(err)
            assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
            assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans.length, 1)
            assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans[0].attributes.sql, q)
            assertSpan(rootSpanVerifier, 'mysql-query', 'MYSQL')
            done()
          })
        })
      })
    })
  })
})