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
        type: 'http/inbound/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'HTTP: Throughput',
        samples: 60,
        type: 'http/inbound/throughput',
        unit: 'req/min'
      }
    },
    https: {
      histogram: {
        name: 'HTTPS: Response time',
        type: 'https/inbound/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'HTTPS: Throughput',
        samples: 60,
        type: 'https/inbound/throughput',
        unit: 'req/min'
      }
    },
    'http-outbound': {
      histogram: {
        name: 'HTTP out: Response time',
        type: 'http/outbound/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'HTTP out: Throughput',
        samples: 60,
        type: 'http/outbound/throughput',
        unit: 'req/min'
      }
    },
    'https-outbound': {
      histogram: {
        name: 'HTTPS out: Response time',
        type: 'https/outbound/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'HTTPS out: Throughput',
        samples: 60,
        type: 'https/outbound/throughput',
        unit: 'req/min'
      }
    },
    mysql: {
      histogram: {
        name: 'MYSQL: Response time',
        type: 'mysql/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'MYSQL: Throughput',
        samples: 60,
        type: 'mysql/throughput',
        unit: 'req/min'
      }
    },
    mongo: {
      histogram: {
        name: 'Mongo: Response time',
        type: 'mongodb/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'Mongo: Throughput',
        samples: 60,
        type: 'mongodb/throughput',
        unit: 'req/min'
      }
    },
    mqtt: {
      histogram: {
        name: 'MQTT: Response time',
        type: 'mqtt/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'MQTT: Throughput',
        samples: 60,
        type: 'mqtt/throughput',
        unit: 'req/min'
      }
    },
    socketio: {
      histogram: {
        name: 'WS: Response time',
        type: 'socketio/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'WS: Throughput',
        samples: 60,
        type: 'socketio/throughput',
        unit: 'req/min'
      }
    },
    redis: {
      histogram: {
        name: 'Redis: Response time',
        type: 'redis/latency',
        measurement: 'mean',
        unit: 'ms'
      },
      meter: {
        name: 'Redis: Throughput',
        samples: 60,
        type: 'redis/throughput',
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
