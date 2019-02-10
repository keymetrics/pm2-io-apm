/**
 * Copyright 2018, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CoreTracer, RootSpan, SpanEventListener, logger } from '@pm2/opencensus-core'
import * as assert from 'assert'
import * as mongodb from 'mongodb-core'
import { parse } from 'url'

import { plugin } from '../mongodb'

export type MongoDBAccess = {
  client: mongodb.MongoClient
}

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
 * Access the mongodb collection.
 * @param url The mongodb URL to access.
 */
function connect (url: string):
    Promise<any> {
  return new Promise((resolve, reject) => {
    const server = new mongodb.Server(parse(url))
    server.on('connect', () => {
      resolve(server)
    })
    server.connect()
  })
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

describe('MongoDBPlugin', () => {
  // For these tests, mongo must be runing. Add OPENCENSUS_MONGODB_TESTS to run
  // these tests.
  const OPENCENSUS_MONGODB_TESTS =
      process.env.OPENCENSUS_MONGODB_TESTS as string
  const OPENCENSUS_MONGODB_HOST =
      process.env.OPENCENSUS_MONGODB_HOST as string
  let shouldTest = true
  if (!OPENCENSUS_MONGODB_TESTS) {
    console.log('Skipping test-mongodb. Run MongoDB to test')
    shouldTest = false
  }

  const URL = `mongodb://${OPENCENSUS_MONGODB_HOST || 'localhost'}`
  const DB_NAME = 'opencensus-tests'
  const COLLECTION_NAME = 'test'
  const VERSION = '3.1.13'

  const tracer = new CoreTracer()
  const rootSpanVerifier = new RootSpanVerifier()
  let client: any

  before((done) => {
    tracer.start({ samplingRate: 1, logger: logger.logger(4) })
    tracer.registerSpanEventListener(rootSpanVerifier)
    plugin.enable(mongodb, tracer, VERSION, {}, '')
    connect(URL)
        .then(server => {
          client = server
          done()
        })
        .catch((err: Error) => {
          console.log(
              'Skipping test-mongodb. Could not connect. Run MongoDB to test', err)
          shouldTest = false
          done()
        })
  })

  beforeEach(function mongoBeforeEach (done) {
    // Skiping all tests in beforeEach() is a workarround. Mocha does not work
    // properly when skiping tests in before() on nested describe() calls.
    // https://github.com/mochajs/mocha/issues/2819
    if (!shouldTest) {
      this.skip()
    }
    rootSpanVerifier.endedRootSpans = []
    // Non traced insertion of basic data to perform tests
    const insertData = [{ a: 1 }, { a: 2 }, { a: 3 }]
    client.insert(`${DB_NAME}.${COLLECTION_NAME}`, insertData, done)
  })

  afterEach((done) => {
    client.command(`${DB_NAME}.$cmd`, { dropDatabase: 1 }, done)
  })

  after(() => {
    if (client) {
      client.destroy()
    }
  })

  /** Should intercept query */
  describe('Instrumenting query operations', () => {
    it('should create a child span for insert', (done) => {
      const insertData = [{ a: 1 }, { a: 2 }, { a: 3 }]

      tracer.startRootSpan({ name: 'insertRootSpan' }, (rootSpan: RootSpan) => {
        client.insert(`${DB_NAME}.${COLLECTION_NAME}`, insertData, (err, result) => {
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.ifError(err)
          assertSpan(rootSpanVerifier, 'mongodb-insert', 'MONGODB-CLIENT')
          done()
        })
      })
    })

    it('should create a child span for update', (done) => {
      tracer.startRootSpan({ name: 'updateRootSpan' }, (rootSpan: RootSpan) => {
        client.update(`${DB_NAME}.${COLLECTION_NAME}`, [ { q: { a: 2 }, u: { $set: { b: 1 } } }], (err, result) => {
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.ifError(err)
          assertSpan(rootSpanVerifier, 'mongodb-update', 'MONGODB-CLIENT')
          done()
        })
      })
    })

    it('should create a child span for remove', (done) => {
      tracer.startRootSpan({ name: 'removeRootSpan' }, (rootSpan: RootSpan) => {
        client.remove(`${DB_NAME}.${COLLECTION_NAME}`, [{ q: { a: 3 }, limit: 0 }], (err, result) => {
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.ifError(err)
          assertSpan(rootSpanVerifier, 'mongodb-remove', 'MONGODB-CLIENT')
          done()
        })
      })
    })
  })

  /** Should intercept cursor */
  describe('Instrumenting cursor operations', () => {
    it('should create a child span for find', (done) => {
      tracer.startRootSpan({ name: 'findRootSpan' }, (rootSpan: RootSpan) => {
        client.cursor(`${DB_NAME}.${COLLECTION_NAME}`, {
          find: `${DB_NAME}.${COLLECTION_NAME}`,
          query: {}
        }).next((err, result) => {
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.ifError(err)
          assertSpan(rootSpanVerifier, 'mongodb-find', 'MONGODB-CLIENT')
          done()
        })
      })
    })
  })

  /** Should intercept command */
  describe('Instrumenting command operations', () => {
    it('should create a child span for count command', (done) => {
      tracer.startRootSpan({ name: 'indexRootSpan' }, (rootSpan: RootSpan) => {
        client.command(`${DB_NAME}.${COLLECTION_NAME}`, {  count: COLLECTION_NAME }, (err, result) => {
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.ifError(err)
          assertSpan(rootSpanVerifier, `mongodb-command`, 'MONGODB-CLIENT')
          done()
        })
      })
    })
  })

  /** Should intercept command */
  describe('Removing Instrumentation', () => {
    before(() => {
      plugin.applyUnpatch()
    })

    it('should not create a child span for query', (done) => {
      const insertData = [{ a: 1 }, { a: 2 }, { a: 3 }]

      tracer.startRootSpan({ name: 'insertRootSpan' }, (rootSpan: RootSpan) => {
        client.insert(`${DB_NAME}.${COLLECTION_NAME}`, insertData, (err, result) => {
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.ifError(err)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assert.strictEqual(
              rootSpanVerifier.endedRootSpans[0].spans.length, 0)
          done()
        })
      })
    })

    it('should not create a child span for cursor', (done) => {
      tracer.startRootSpan({ name: 'findRootSpan' }, (rootSpan: RootSpan) => {
        client.cursor(`${DB_NAME}.${COLLECTION_NAME}`, {
          find: `${DB_NAME}.${COLLECTION_NAME}`,
          query: {}
        }).next((err, result) => {
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.ifError(err)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assert.strictEqual(
              rootSpanVerifier.endedRootSpans[0].spans.length, 0)
          done()
        })
      })
    })

    it('should not create a child span for command', (done) => {
      tracer.startRootSpan({ name: 'indexRootSpan' }, (rootSpan: RootSpan) => {
        client.command(`${DB_NAME}.${COLLECTION_NAME}`, {  count: COLLECTION_NAME }, (err, result) => {
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.ifError(err)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assert.strictEqual(
              rootSpanVerifier.endedRootSpans[0].spans.length, 0)
          done()
        })
      })
    })
  })
})
