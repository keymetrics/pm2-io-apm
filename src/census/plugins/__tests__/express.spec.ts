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

import { CoreTracer, RootSpan, SpanEventListener, logger } from '@opencensus/core'
import * as assert from 'assert'
import * as express from 'express'
import * as http from 'http'
import * as httpPlugin from '../http'

import { plugin } from '../express'
import { AddressInfo } from 'net'

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

const httpRequest = {
  get: (options: http.ClientRequestArgs | string) => {
    return new Promise((resolve, reject) => {
      return http.get(options, resp => {
        let data = ''
        resp.on('data', chunk => {
          data += chunk
        })
        resp.on('end', () => {
          resolve(data)
        })
        resp.on('error', err => {
          reject(err)
        })
      })
    })
  }
}

describe('VuePlugin', () => {

  const VERSION = '4.16.0'
  const tracer = new CoreTracer()
  const rootSpanVerifier = new RootSpanVerifier()

  before((done) => {
    tracer.start({ samplingRate: 1, logger: logger.logger(4) })
    tracer.registerSpanEventListener(rootSpanVerifier)
    httpPlugin.plugin.enable(http, tracer, process.versions.node, {}, '')
    plugin.enable(express, tracer, VERSION, {}, '')
    return done()
  })

  beforeEach(function redisBeforeEach () {
    rootSpanVerifier.endedRootSpans = []
  })

  /** Should intercept renderer */
  describe('Instrumenting normal get operations', () => {
    it('should create a child span for middlewares', (done) => {
      const app = express()
      app.use(express.json())
      app.use(function customMiddleware (req, res, next) {
        for (let i = 0; i < 1000; i++) {
          continue
        }
        return next()
      })
      const router = express.Router()
      app.use('/toto', router)
      router.use('/:id', (req, res, next) => {
        return res.status(200).end()
      })
      const server = http.createServer(app)
      server.listen(0, async (err: Error) => {
        const port = (server.address() as AddressInfo).port
        assert.ifError(err)
        assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
        await httpRequest.get(`http://localhost:${port}/toto/tata`)
        assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 2)
        const serverSpan = rootSpanVerifier.endedRootSpans[0]
        assert(serverSpan.attributes['http.route'] === '/toto/:id')
        assert(serverSpan.name === '/toto/tata')
        assert(serverSpan.spans.length === 6)
        assert(serverSpan.spans.every(span => span.name.indexOf('Middleware') > -1))
        server.close()
        return done()
      })
    })
  })

  /** Should intercept command */
  describe('Removing Instrumentation', () => {
    before(() => {
      plugin.applyUnpatch()
    })

    it('should not create a child span for middlewares', (done) => {
      const app = express()
      app.use(express.json())
      app.use(function customMiddleware (req, res, next) {
        for (let i = 0; i < 1000; i++) {
          continue
        }
        return next()
      })
      const router = express.Router()
      app.use('/toto', router)
      router.use('/:id', (req, res, next) => {
        return res.status(200).end()
      })
      const server = http.createServer(app)
      server.listen(0, async (err: Error) => {
        const port = (server.address() as AddressInfo).port
        assert.ifError(err)
        assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 0)
        await httpRequest.get(`http://localhost:${port}/toto/tata`)
        assert.strictEqual(rootSpanVerifier.endedRootSpans.length, 2)
        const serverSpan = rootSpanVerifier.endedRootSpans[0]
        assert(serverSpan.name === '/toto/tata')
        assert(serverSpan.spans.length === 0)
        server.close()
        return done()
      })
    })

  })
})
