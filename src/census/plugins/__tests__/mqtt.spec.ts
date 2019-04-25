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

import { CoreTracer, RootSpan, SpanEventListener, Span, logger, SpanKind } from '@opencensus/core'
import * as assert from 'assert'
import * as mqtt from 'mqtt'

import { plugin } from '../mqtt'

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
    expectedKind: SpanKind, verifyAttribute?: (span: Span) => boolean) {
  assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
  assert.strictEqual(rootSpanVerifier.endedRootSpans[0].spans.length, 1)
  assert.strictEqual(
      rootSpanVerifier.endedRootSpans[0].spans[0].name, expectedName)
  assert.strictEqual(
      rootSpanVerifier.endedRootSpans[0].spans[0].kind, expectedKind)
  if (typeof verifyAttribute === 'function') {
    for (let span of rootSpanVerifier.endedRootSpans[0].spans) {
      assert(verifyAttribute(span), 'failed to verify attribute')
    }
  }
}

describe('MqttPlugin', () => {
  // For these tests, mongo must be runing. Add OPENCENSUS_MQTT_TESTS to run
  // these tests.
  const OPENCENSUS_MQTT_TESTS =
      process.env.OPENCENSUS_MQTT_TESTS as string
  const OPENCENSUS_MQTT_HOST =
      process.env.OPENCENSUS_MQTT_HOST as string
  let shouldTest = true
  if (!OPENCENSUS_MQTT_TESTS) {
    console.log('Skipping test-mqtt. Run MQTT to test')
    shouldTest = false
  }

  const URL = `mqtt://${OPENCENSUS_MQTT_HOST || 'localhost'}:1883`
  const VERSION = '2.18.0'

  const tracer = new CoreTracer()
  const rootSpanVerifier = new RootSpanVerifier()
  let client: mqtt.MqttClient

  before((done) => {
    tracer.start({ samplingRate: 1, logger: logger.logger(4) })
    tracer.registerSpanEventListener(rootSpanVerifier)
    plugin.enable(mqtt, tracer, VERSION, {}, '')
    client = mqtt.connect({
      brokerUrl: URL
    })
    client.on('error', (err: Error) => {
      console.log(
        'Skipping test-mqtt. Could not connect. Run Mqtt to test', err)
      shouldTest = false
      done()
    })
    client.on('connect', _ => done())
  })

  after((done) => {
    client.end(true, done)
  })

  beforeEach(function mqttBeforeEach (done) {
    // Skiping all tests in beforeEach() is a workarround. Mocha does not work
    // properly when skiping tests in before() on nested describe() calls.
    // https://github.com/mochajs/mocha/issues/2819
    if (!shouldTest) {
      this.skip()
    }
    rootSpanVerifier.endedRootSpans = []
    return done()
  })

  /** Should intercept query */
  describe('Instrumenting operations', () => {

    it('should create a child span for publish', (done) => {
      tracer.startRootSpan({ name: 'insertRootSpan' }, (rootSpan: RootSpan) => {
        client.publish('randomTopic', 'msg', (err) => {
          assert.ifError(err)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assertSpan(rootSpanVerifier, `mqtt-publish`, SpanKind.CLIENT,
            (span) => {
              return span.attributes.arguments === undefined &&
                span.attributes.topic === 'randomTopic' &&
                  span.attributes['message.length'] === 3
            })
          done()
        })
      })
    })

    it('should create a child span for subscribe', (done) => {
      tracer.startRootSpan({ name: 'getRootSpan' }, (rootSpan: RootSpan) => {
        client.subscribe('test', (err) => {
          assert.ifError(err)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assertSpan(rootSpanVerifier, `mqtt-subscribe`, SpanKind.CLIENT,
            (span) => {
              return span.attributes.arguments === undefined &&
              span.attributes.topic === 'test'
            })
          done()
        })
      })
    })

    it('should create a child span for unsubscribe', (done) => {
      tracer.startRootSpan({ name: 'removeRootSpan' }, (rootSpan: RootSpan) => {
        client.unsubscribe('test', (err, result) => {
          assert.ifError(err)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assertSpan(rootSpanVerifier, `mqtt-unsubscribe`, SpanKind.CLIENT,
            (span) => {
              return span.attributes.arguments === undefined &&
              span.attributes.topic === 'test'
            })
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

    it('should not create a child span for publish', (done) => {
      tracer.startRootSpan({ name: 'insertRootSpan' }, (rootSpan: RootSpan) => {
        client.publish('hash', 'random', (err) => {
          assert.ifError(err)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assert.strictEqual(
              rootSpanVerifier.endedRootSpans[0].spans.length, 0)
          done()
        })
      })
    })

    it('should not create a child span for subscribe', (done) => {
      tracer.startRootSpan({ name: 'getRootSpan' }, (rootSpan: RootSpan) => {
        client.subscribe('test', (err) => {
          assert.ifError(err)
          rootSpan.end()
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assert.strictEqual(
              rootSpanVerifier.endedRootSpans[0].spans.length, 0)
          done()
        })
      })
    })

    it('should not create a child span for unsubscribe', (done) => {
      tracer.startRootSpan({ name: 'removeRootSpan' }, (rootSpan: RootSpan) => {
        client.unsubscribe('test', (err) => {
          assert.ifError(err)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assert.strictEqual(
              rootSpanVerifier.endedRootSpans[0].spans.length, 0)
          done()
        })
      })
    })
  })
})
