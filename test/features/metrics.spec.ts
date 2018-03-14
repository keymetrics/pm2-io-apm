import { expect, assert } from 'chai'
import 'mocha'

import Metric from '../../src/features/metrics'

describe('Metrics', () => {

  describe('init', () => {
    it('should init metrics', () => {
      const metric = new Metric()
      const metrics = metric.init()

      expect(metrics.hasOwnProperty('meter')).to.equal(true)
      expect(metrics.hasOwnProperty('histogram')).to.equal(true)
      expect(metrics.hasOwnProperty('counter')).to.equal(true)
      expect(metrics.hasOwnProperty('metric')).to.equal(true)
    })
  })

  describe('meter', () => {
    it('should return undefined if no name provided', () => {
      const metric = new Metric()

      const meter = metric.meter({tickInterval: 50})
      expect(meter).to.equal(undefined)
    })

    it('should calculate a meter', (done) => {
      const metric = new Metric()

      const meter = metric.meter({name: 'test', tickInterval: 50})

      if (!meter) {
        assert.fail()
        return
      }

      expect(meter.val()).to.equal(0)

      setTimeout(function () {
        expect(meter.val()).to.equal(0)
        done()
      }, 60)
    })

    it('should calculate a meter after mark', (done) => {
      const metric = new Metric()

      const meter = metric.meter({name: 'test', tickInterval: 50})

      if (!meter) {
        assert.fail()
        return
      }

      expect(meter.val()).to.equal(0)

      meter.mark(10)

      setTimeout(function () {
        expect(meter.val()).to.equal(0.17)
        done()
      }, 60)
    })
  })

  describe('counter', () => {
    it('should return undefined if no name provided', () => {
      const metric = new Metric()

      const counter = metric.counter({})
      expect(counter).to.equal(undefined)
    })

    it('should calculate a meter', () => {
      const metric = new Metric()

      const counter = metric.counter({name: 'test'})

      if (!counter) {
        assert.fail()
        return
      }

      expect(counter.val()).to.equal(0)

      counter.inc()
      expect(counter.val()).to.equal(1)

      counter.dec()
      expect(counter.val()).to.equal(0)

      counter.inc(2)
      expect(counter.val()).to.equal(2)

      counter.dec(1)
      expect(counter.val()).to.equal(1)

      counter.reset()
      expect(counter.val()).to.equal(0)

      counter.reset(10)
      expect(counter.val()).to.equal(10)
    })
  })

  describe('histogram', () => {
    it('should return undefined if no name provided', () => {
      const metric = new Metric()

      const histo = metric.histogram({})
      expect(histo).to.equal(undefined)
    })

    it('should calculate an histogram', () => {
      const metric = new Metric()

      const histo = metric.histogram({
        name        : 'latency',
        measurement : 'mean'
      })

      if (!histo) {
        assert.fail()
        return
      }

      expect(histo.val()).to.equal(0)

      histo.update(10)

      expect(histo.val()).to.equal(10)

      histo.update(1)

      expect(histo.val()).to.equal(5.5)

      const res = histo.fullResults()
      expect(res.min).to.equal(1)
      expect(res.max).to.equal(10)
      expect(res.sum).to.equal(11)
      expect(res.variance).to.equal(40.5)
      expect(res.mean).to.equal(5.5)
      expect(res.count).to.equal(2)
      expect(res.median).to.equal(5.5)
      expect(res.p75).to.equal(10)
      expect(res.p95).to.equal(10)
      expect(res.p99).to.equal(10)
      expect(res.p999).to.equal(10)
      expect(res.ema).to.equal(4.000000000000001)
    })

    it('should calculate an histogram and getters', () => {
      const metric = new Metric()

      const histo = metric.histogram({
        name        : 'latency',
        measurement : 'max'
      })

      if (!histo) {
        assert.fail()
        return
      }

      expect(histo.val()).to.equal(undefined)

      histo.update(10)
      histo.update(1)
      expect(histo.val()).to.equal(10)
      expect(histo.getMin()).to.equal(1)
      expect(histo.getMax()).to.equal(10)
      expect(histo.getCount()).to.equal(2)
      expect(histo.getSum()).to.equal(11)
    })

    it('should calculate an histogram : mean', () => {
      const metric = new Metric()

      const histo = metric.histogram({
        name        : 'latency',
        measurement : 'mean'
      })

      if (!histo) {
        assert.fail()
        return
      }

      expect(histo.val()).to.equal(0)

      histo.update(10)
      expect(histo.val()).to.equal(10)
    })

    it('should calculate an histogram : median', () => {
      const metric = new Metric()

      const histo = metric.histogram({
        name        : 'latency',
        measurement : 'median'
      })

      if (!histo) {
        assert.fail()
        return
      }

      expect(histo.val()).to.equal(null)

      histo.update(10)
      expect(histo.val()).to.equal(10)
    })
  })

  describe('metric', () => {
    it('should return undefined if no name provided', () => {
      const metrics = new Metric()

      const metric = metrics.metric({})
      expect(metric).to.equal(undefined)
    })

    it('should create a metric and and fail cause no name', () => {
      const metrics = new Metric()
      let metric = metrics.metric({
      })

      expect(metric).to.equal(undefined)
    })

    it('should create a metric and use it', () => {
      const metrics = new Metric()
      let metric = metrics.metric({
        name: 'test'
      })

      expect(metric.val()).to.equal(0)
      metric.set(1)
      expect(metric.val()).to.equal(1)
      let vars = metrics._getVar()
      expect(vars.get('test').unit).to.equal(undefined)
      expect(vars.get('test').agg_type).to.equal('avg')
      expect(vars.get('test').historic).to.equal(true)
      expect(vars.get('test').type).to.equal('test')

      metric = metrics.metric({
        name: 'test',
        type: 'type',
        agg_type: 'sum',
        historic: false,
        unit: 'unit'
      })

      vars = metrics._getVar()
      expect(vars.get('test').unit).to.equal('unit')
      expect(vars.get('test').agg_type).to.equal('sum')
      expect(vars.get('test').historic).to.equal(false)
      expect(vars.get('test').type).to.equal('type')

      metric = metrics.metric({
        name: 'test',
        historic: true
      })

      vars = metrics._getVar()
      expect(vars.get('test').historic).to.equal(true)

      metric = metrics.metric({
        name: 'test',
        historic: true,
        value: function () {
          return 'test is real !'
        }
      })

      expect(metric.val()).to.equal('test is real !')
    })
  })
})
