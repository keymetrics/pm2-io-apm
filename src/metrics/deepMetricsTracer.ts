import MetricsFeature from '../features/metrics'

export default class DeepMetricsTracer {
  private metricFeature: MetricsFeature
  private tracer
  private eventName: string
  private listenerFunc: Function
  private latency
  private throughput

  private allMetrics = {
    http: {
      histogram: {
        name: 'HTTP: Response time',
        type: 'internal/http/inbound/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'HTTP: Throughput',
        samples: 60,
        type: 'internal/http/inbound/throughput',
        unit: 'req/min'
      }
    },
    https: {
      histogram: {
        name: 'HTTPS: Response time',
        type: 'internal/https/inbound/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'HTTPS: Throughput',
        samples: 60,
        type: 'internal/https/inbound/throughput',
        unit: 'req/min'
      }
    },
    'http-outbound': {
      histogram: {
        name: 'HTTP out: Response time',
        type: 'internal/http/outbound/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'HTTP out: Throughput',
        samples: 60,
        type: 'internal/http/outbound/throughput',
        unit: 'req/min'
      }
    },
    'https-outbound': {
      histogram: {
        name: 'HTTPS out: Response time',
        type: 'internal/https/outbound/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'HTTPS out: Throughput',
        samples: 60,
        type: 'internal/https/outbound/throughput',
        unit: 'req/min'
      }
    },
    mysql: {
      histogram: {
        name: 'MYSQL: Response time',
        type: 'internal/mysql/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'MYSQL: Throughput',
        samples: 60,
        type: 'internal/mysql/throughput',
        unit: 'req/min'
      }
    },
    mongo: {
      histogram: {
        name: 'Mongo: Response time',
        type: 'internal/mongodb/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'Mongo: Throughput',
        samples: 60,
        type: 'internal/mongodb/throughput',
        unit: 'req/min'
      }
    },
    mqtt: {
      histogram: {
        name: 'MQTT: Response time',
        type: 'internal/mqtt/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'MQTT: Throughput',
        samples: 60,
        type: 'internal/mqtt/throughput',
        unit: 'req/min'
      }
    },
    socketio: {
      histogram: {
        name: 'WS: Response time',
        type: 'internal/socketio/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'WS: Throughput',
        samples: 60,
        type: 'internal/socketio/throughput',
        unit: 'req/min'
      }
    },
    redis: {
      histogram: {
        name: 'Redis: Response time',
        type: 'internal/redis/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'Redis: Throughput',
        samples: 60,
        type: 'internal/redis/throughput',
        unit: 'req/min'
      }
    }
  }

  constructor (metricFeature: MetricsFeature, tracer, eventName) {
    this.metricFeature = metricFeature
    this.tracer = tracer
    this.eventName = eventName
    this.listenerFunc = this.listener.bind(this)
  }

  init () {
    this.tracer.on(this.eventName, this.listenerFunc)
  }

  destroy () {
    this.tracer.removeListener(this.eventName, this.listenerFunc)
  }

  listener (data) {

    if (!this.latency) {
      this.latency = this.metricFeature.histogram(this.allMetrics[this.eventName].histogram)
    }

    if (!this.throughput) {
      this.throughput = this.metricFeature.meter(this.allMetrics[this.eventName].meter)
    }

    data = JSON.parse(data)
    this.throughput.mark()
    if (data.duration) {
      this.latency.update(data.duration)
    }
  }
}
