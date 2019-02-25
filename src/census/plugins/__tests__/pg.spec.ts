import { CoreTracer, RootSpan, SpanEventListener, logger, SpanKind } from '@opencensus/core'
import * as assert from 'assert'
import * as path from 'path'
import * as pg from 'pg'

import { plugin } from '../pg'

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
 * Asserts root spans attributes.
 * @param rootSpanVerifier An instance of rootSpanVerifier to analyse RootSpan
 * instances from.
 * @param expectedName The expected name of the first root span.
 * @param expectedKind The expected kind of the first root span.
 */
function assertSpan (
  rootSpanVerifier: RootSpanVerifier, expectedName: string,
  expectedKind: SpanKind) {
  assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
  assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans.length, 1)
  assert.strictEqual(
      rootSpanVerifier.endedRootSpans[0].spans[0].name, expectedName)
  assert.strictEqual(
      rootSpanVerifier.endedRootSpans[0].spans[0].kind, expectedKind)
}

describe('PGPlugin', () => {
  // For these tests, postgres must be runing. Add OPENCENSUS_POSTGRES_TESTS to run
  // these tests.
  const OPENCENSUS_PG_TESTS =
      process.env.OPENCENSUS_PG_TESTS as string
  const OPENCENSUS_PG_HOST =
      process.env.OPENCENSUS_PG_HOST as string
  const OPENCENSUS_PG_DATABASE =
      process.env.OPENCENSUS_PG_DATABASE as string
  const OPENCENSUS_PG_USER =
      process.env.OPENCENSUS_PG_USER as string
  const OPENCENSUS_PG_PASSWORD =
      process.env.OPENCENSUS_PG_PASSWORD as string
  let shouldTest = true
  if (!OPENCENSUS_PG_TESTS) {
    console.log('Skipping test-pg. Run Postgres to test')
    shouldTest = false
  }

  const CONFIG = {
    user: OPENCENSUS_PG_USER || 'postgres',
    host: OPENCENSUS_PG_HOST || 'localhost',
    database: OPENCENSUS_PG_DATABASE || 'test',
    password: OPENCENSUS_PG_PASSWORD || 'password'
  }
  const VERSION = '7.8.0'

  const tracer = new CoreTracer()
  const rootSpanVerifier = new RootSpanVerifier()
  let client: any
  let pool: any

  before(async () => {
    tracer.start({ samplingRate: 1, logger: logger.logger(4) })
    tracer.registerSpanEventListener(rootSpanVerifier)
    const basedir = path.dirname(require.resolve('pg'))
    plugin.enable(pg, tracer, VERSION, {}, basedir)
    client = new pg.Client(CONFIG)
    try {
      await client.connect()
    } catch (err) {
      console.log(
        'Skipping test-pg. Could not connect. Run Postgres to test', err)
      shouldTest = false
    }
  })

  beforeEach(function pgBeforeEach (done) {
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
      client.end()
    }
  })

  /** Should intercept query */
  describe('Instrumenting connection operations', () => {
    it('should create a child span for select with callback', done => {
      tracer.startRootSpan({ name: 'selectCallbackRootSpan' }, (rootSpan: RootSpan) => {
        const q = 'SELECT 1 as value'
        client.query(q, (err, result) => {
          assert.strictEqual(result.rows[0].value, 1)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.ifError(err)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans.length, 1)
          assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans[0].attributes.query, q)
          assertSpan(rootSpanVerifier, 'pg-query', SpanKind.CLIENT)
          done()
        })
      })
    })

    it('should create a span for select with promise', done => {
      tracer.startRootSpan({ name: 'selectPromRootSpan' }, async (rootSpan: RootSpan) => {
        const q = 'SELECT 2 as value'
        const result = await client.query(q)
        assert.strictEqual(result.rows[0].value, 2)
        assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
        rootSpan.end()
        assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
        assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans.length, 1)
        assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans[0].attributes.query, q)
        assertSpan(rootSpanVerifier, 'pg-query', SpanKind.CLIENT)
        done()
      })
    })

    it('should create a child span for errored query', done => {
      tracer.startRootSpan({ name: 'errorCallbackRootSpan' }, (rootSpan: RootSpan) => {
        const q = 'SELECT * FROM notexisttable'
        client.query(q, (err, result) => {
          assert.ok(err instanceof Error)
          assert.strictEqual(err.code, '42P01')
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans.length, 1)
          assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans[0].attributes.query, q)
          assertSpan(rootSpanVerifier, 'pg-query', SpanKind.CLIENT)
          done()
        })
      })
    })

    it('should create a child span for select with eventemitter', done => {
      tracer.startRootSpan({ name: 'selectEventRootSpan' }, (rootSpan: RootSpan) => {
        const q = 'SELECT 4 as value'
        // Must use new Query for eventemitter
        // https://node-postgres.com/guides/upgrading#client-query-submittable-
        const query = client.query(new pg.Query(q))
        query.on('end', res => {
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans.length, 1)
          assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans[0].attributes.query, q)
          assertSpan(rootSpanVerifier, 'pg-query', SpanKind.CLIENT)
          done()
        })
      })
    })
  })
})
