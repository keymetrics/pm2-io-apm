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
import * as vueServerRenderer from 'vue-server-renderer'
import * as Vue from 'vue'
import { readFileSync } from 'fs'

import { plugin } from '../vue'

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

describe('VuePlugin', () => {

  const VERSION = '2.6.0'

  const tracer = new CoreTracer()
  const rootSpanVerifier = new RootSpanVerifier()
  // for a unknown reason, Vue is a correct constructor but not for typescript
  // @ts-ignore
  const vueVM = new Vue({
    data: {
      name: 'a data'
    },
    template: `<div> Here is some data: {{ name }}</div>`
  })

  before((done) => {
    tracer.start({ samplingRate: 1, logger: logger.logger(4) })
    tracer.registerSpanEventListener(rootSpanVerifier)
    plugin.enable(vueServerRenderer, tracer, VERSION, {}, '')
    return done()
  })

  beforeEach(function redisBeforeEach () {
    rootSpanVerifier.endedRootSpans = []
  })

  after(() => {
    vueVM.$destroy()
  })

  /** Should intercept renderer */
  describe('Instrumenting normal renderer operations', () => {
    it('should create a child span for renderToString', (done) => {
      tracer.startRootSpan({ name: 'insertRootSpan' }, async (rootSpan: RootSpan) => {
        const renderer = vueServerRenderer.createRenderer()
        renderer.renderToString(vueVM, (err, html) => {
          assert.ifError(err)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert(typeof html === 'string', 'should have correctly output the result')
          assertSpan(rootSpanVerifier, 'vue-renderer', SpanKind.CLIENT)
          return done()
        })
      })
    })
  })

  /** Should bundle renderer */
  describe('Instrumenting normal bundle operations', () => {
    it('should create a child span for renderToString', (done) => {
      tracer.startRootSpan({ name: 'insertRootSpan' }, async (rootSpan: RootSpan) => {
        const renderer = vueServerRenderer.createBundleRenderer(
          require('./fixtures/vue-ssr-bundle.json'),
          {
            template: readFileSync(__dirname + '/fixtures/vue-template.html', 'utf-8')
          }
        )
        const context = {
          title: 'Vue SSR Tutorial'
        }
        renderer.renderToString(context, (err, html) => {
          assert.ifError(err)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert(typeof html === 'string', 'should have correctly output the result')
          assertSpan(rootSpanVerifier, 'vue-renderer', SpanKind.CLIENT)
          return done()
        })
      })
    })
  })

  /** Should intercept command */
  describe('Removing Instrumentation', () => {
    before(() => {
      plugin.applyUnpatch()
    })

    it('should not create a child span for renderToString', (done) => {
      tracer.startRootSpan({ name: 'insertRootSpan' }, async (rootSpan: RootSpan) => {
        const renderer = vueServerRenderer.createRenderer()
        renderer.renderToString(vueVM, (err, html) => {
          assert.ifError(err)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assert.strictEqual(
              rootSpanVerifier.endedRootSpans[0].spans.length, 0)
          assert(typeof html === 'string', 'should have correctly output the result')
          return done()
        })
      })
    })

    it('should not create a child span for renderToString', (done) => {
      tracer.startRootSpan({ name: 'insertRootSpan' }, async (rootSpan: RootSpan) => {
        const renderer = vueServerRenderer.createBundleRenderer(
          require(__dirname + '/fixtures/vue-ssr-bundle.json'),
          {
            template: readFileSync(__dirname + '/fixtures/vue-template.html', 'utf-8')
          }
        )
        const context = {
          title: 'Vue SSR Tutorial'
        }
        renderer.renderToString(context, (err, html) => {
          assert.ifError(err)
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
          rootSpan.end()
          assert(typeof html === 'string', 'should have correctly output the result')
          assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 1)
          assert.strictEqual(
              rootSpanVerifier.endedRootSpans[0].spans.length, 0)
          return done()
        })
      })
    })
  })
})
