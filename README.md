<div align="center">
  <a href="http://pm2.keymetrics.io">
    <img width=411px src="https://raw.githubusercontent.com/keymetrics/pm2-io-apm/master/pres/io-white.png">
  </a>
  <br/>
  <br/>
  <a href="https://github.com/keymetrics/pm2-io-apm">
    <img src="https://ci.keymetrics.io/api/badges/keymetrics/pm2-io-apm/status.svg?branch=master"/>
  </a>
<br/>
<br/>
</div>

The [@pm2/io](https://github.com/keymetrics/pm2-io-apm/tree/master/test) module comes along with PM2. It is the PM2 part responsible for gathering the metrics, reporting exceptions, exposing remote actions and every outside interaction with your application.

# Table of Contents

- [**Installation**](https://github.com/keymetrics/pm2-io-apm/tree/master#installation)
- [**Expose Custom Metrics**](https://github.com/keymetrics/pm2-io-apm/tree/master#expose-custom-metrics)
- [**Expose Remote Actions**](https://github.com/keymetrics/pm2-io-apm/tree/master#expose-remote-actions)
- [**Report Caught Exceptions**](https://github.com/keymetrics/pm2-io-apm/tree/master#report-caught-exceptions)
- [**Report Custom Events (deprecated)**](https://github.com/keymetrics/pm2-io-apm/tree/master#report-custom-events-deprecated)
- [**Predefined Metrics**](https://github.com/keymetrics/pm2-io-apm/tree/master#predefined-metrics)
- [**Configuration**](https://github.com/keymetrics/pm2-io-apm/tree/master#configuration)
- [**Entrypoint**](https://github.com/keymetrics/pm2-io-apm/tree/master#entrypoint)
- [**Development**](https://github.com/keymetrics/pm2-io-apm/tree/master#development)


# Installation

With npm:

```bash
npm install @pm2/io --save
```

With yarn:

```bash
yarn add @pm2/io
```

## Expose Custom Metrics

@pm2/io allows you to gather metrics from your code to be reported in `pm2 monit` or in the Keymetrics dashboard.

### Create a custom metrics

You can create a new custom metrics with the method `metric()` of `@pm2/io`.

```javascript
const io = require('@pm2/io');

io.metric({
  name: 'Realtime user',
});
```

This arguments are available:

- **name**: The metric name (required; string)
- **type**: The type of metric (default 'metric', string)
- **agg_type**: type of aggregation (default 'avg'; string: )
- **unit**: unit of the measure (default ''; string)
- **historic**: keep the history in PM2 Plus (default: true; boolean)

There are 4 different types of metrics:

- **metric**: To expose a variable's value
- **counter**: A discrete counter to be triggered manually to count a number of occurrence
- **meter**: To measure a frequency, a number of occurrences of a repeating event per unit of time
- **histogram**: To measure a statistic, a statistic on a metric over the last 5 minutes

### Metric: Variable Exposition

The first type of metric, called `metric`, allows to expose a variable's value. The variable can be exposed passively, with a function that gets called every second, or actively, with a method that you use to update the value.

#### Passive Mode

```javascript
const io = require('@pm2/io');

io.metric({
  name: 'Realtime user',
  value: function() {
    return Object.keys(users).length;
  }
});
```

#### Active Mode

In active mode, you need to create a probe and call the method `set()` to update the value.

```javascript
const Realtime_Value = io.metric({
  name: 'Realtime Value'
});

Realtime_Value.set(23);
```

#### Inline Mode

In inline mode, you can create a probe with a simple string.

```javascript
const metric = io.metric('Inline');

metric.set(23);
```

### Counter: Discrete Counter

The second type of metric, called `counter`, is a discrete counter that helps you count the number of occurrence of a particular event. The counter starts at 0 and can be incremented or decremented.

```javascript
const io = require('@pm2/io');

const Current_req_processed = io.counter({
  name: 'Current req processed',
  type: 'counter',
});

http.createServer((req, res) => {
  // Increment the counter, counter will eq 1
  Current_req_processed.inc();
  req.on('end', () => {
    // Decrement the counter, counter will eq 0
    Current_req_processed.dec();
  });
});
```

### Meter: Frequency

The third type of metric, called `meter`, compute the frequency of an event. Each time the event happens, you need to call the `mark()` method. By default, the frequency is the number of events per second over the last minute.

```javascript
const io = require('@pm2/io');

const reqsec = io.meter({
  name: 'req/sec',
  type: 'meter',
});

http.createServer((req, res) => {
  reqsec.mark();
  res.end({ success: true });
});
```

Additional options:
- **samples**: (optional)(default: 1) Rate unit. Defaults to **1** sec.
- **timeframe**: (optional)(default: 60) Timeframe over which the events will be analyzed. Defaults to **60** sec.

### Histogram: Statistics

Collect values and provide statistic tools to explore their distribution over the last 5 minutes.

```javascript
const io = require('@pm2/io');

const latency = io.histogram({
  name: 'latency',
  measurement: 'mean'
});

const latencyValue = 0;

setInterval(() => {
  latencyValue = Math.round(Math.random() * 100);
  latency.update(latencyValue);
}, 100);
```

Options are:
- **measurement** : default: mean; min, max, sum, count, variance, mean, stddev, median, p75, p95, p99, p99.

## Expose Remote Actions: Trigger Functions remotely

Remotely trigger functions from Keymetrics.

### Simple actions

The function takes a function as a parameter (cb here) and need to be called once the job is finished.

Example:

```javascript
const io = require('@pm2/io');

io.action('db:clean', (cb) => {
  clean.db(() => {
    /**
     * cb() must be called at the end of the action
     */
     cb({ success: true });
  });
});
```

### Scoped actions (beta)

Scoped Actions are advanced remote actions that can be also triggered from Keymetrics.

Two arguments are passed to the function, data (optional data sent from Keymetrics) and res that allows to emit log data and to end the scoped action.

Example:

```javascript
io.scopedAction('long running lsof', (data, res) => {
  const child = spawn('lsof', []);

  child.stdout.on('data', (chunk) => {
    chunk.toString().split('\n').forEach(function(line) {
      res.send(line); // This send log to Keymetrics to be saved (for tracking)
    });
  });

  child.stdout.on('end', (chunk) => {
    res.end('end'); // This end the scoped action
  });

  child.on('error', (e) => {
    res.error(e);  // This report an error to Keymetrics
  });

});
```

## Report Caught Exceptions

By default, in the Issue tab, you are only alerted for uncaught exceptions. Any exception that you catch is not reported. You can manually report them with the `notifyError()` method.

```javascript
const io = require('@pm2/io');

io.notifyError(new Error('This is an error'));
```

## Configuration

### Global configuration object

```javascript
const io = require('@pm2/io')

io.init({
  metrics: {
    eventLoopActive: true, // (default: true) Monitor active handles and active requests
    eventLoopDelay: true,  // (default: true) Get event loop's average delay

    // Network monitoring at the application level
    network: {
      traffic: true, // (default: true) Allow application level network monitoring
      ports: true    // (default: false) Shows which ports your app is listening on
    },

    // Transaction Tracing system configuration
    transaction: {
      http: true,               // (default: true) HTTP routes logging
      tracing: {                // (default: false) Enable transaction tracing
        http_latency: 1,        // (default: 200) minimum latency in milliseconds to take into account
        ignore_routes: ['/foo'] // (default: empty) exclude some routes
      }
    },

    deepMetrics: {
      mongo: true,             // (default: true) Mongo connections monitoring
      mysql: true,             // (default: true) MySQL connections monitoring
      mqtt: true,              // (default: true) Mqtt connections monitoring
      socketio: true,          // (default: true) WebSocket monitoring
      redis: true,             // (default: true) Redis monitoring
      http: true,              // (default: true) Http incoming requests monitoring
      https: true,             // (default: true) Https incoming requests monitoring
      "http-outbound": true,   // (default: true) Http outbound requests monitoring
      "https-outbound": true   // (default: true) Https outbound requests monitoring
    },

    v8: {
      new_space: true,                    // (default: true) New objects space size
      old_space: true,                    // (default: true) Old objects space size
      map_space: true,                    // (default: true) Map space size
      code_space: true,                   // (default: true) Executable space size
      large_object_space: true,           // (default: true) Large objects space size
      total_physical_size: false,         // (default: false) Physical heap size
      total_heap_size: true,              // (default: true)  Heap size
      total_available_size: false,        // (default: false) Total available size for the heap
      total_heap_size_executable: true,   // (default: true)  Executable heap size
      used_heap_size: true,               // (default: true)  Used heap size
      heap_size_limit: true,              // (default: true)  Heap size maximum size
      malloced_memory: false,             // (default: false) Allocated memory
      peak_malloced_memory: false,        // (default: false) Peak of allocated memory
      does_zap_garbage: false,            // (default: false) Zap garbage enable/disable
      GC: {
        totalHeapSize: true,              // (default: true)  GC heap size
        totalHeapExecutableSize: true,    // (default: true)  GC executable heap size
        usedHeapSize: true,               // (default: true)  GC used heap size
        heapSizeLimit: false,             // (default: false) GC heap size maximum size
        totalPhysicalSize: false,         // (default: false) GC heap physical size
        totalAvailableSize: false,        // (default: false) GC available size
        mallocedMemory: false,            // (default: false) GC allocated memory
        peakMallocedMemory: false,        // (default: false) GC peak of allocated memory
        gcType: true,                     // (default: true)  Type of GC (scavenge, mark/sweep/compact, ...)
        gcPause: true                     // (default: true)  Duration of pause (in milliseconds)
      }
    },
    worker: true, // (default false) : get number of workers and threads
    fileRequests: true // (default false) : get requests to file system
  },

  actions: {
    eventLoopDump: false, // (default: false) Enable event loop dump action
    profilingCpu: true,   // (default: true) Enable CPU profiling actions
    profilingHeap: true   // (default: true) Enable Heap profiling actions
  }
});
```

### Custom configuration

If you want to activate default options of a section :
```javascript
const io = require('@pm2/io')

io.init({
  metrics: {
    v8: true
  }
})
```

If you want to activate all options of a section :
```javascript
const io = require('@pm2/io')

io.init({
  metrics: {
    v8: 'all'
  }
})
```

If you want to customize a section :
```javascript
const io = require('@pm2/io')

io.init({
  metrics: {
    v8: {
      new_space: false, // don't take new_space into account
      ...
    }
  }
})
```
**Note** : if you do not disable the default options they will be kept (merged with your configuration)

## Entrypoint

### Usage

```javascript
const app = require('express')()
const io = require('@pm2/io')

class MyEntrypoint extends io.Entrypoint {

    onStop (err, cb, code, signal) {
      console.log(`Application stopped with code ${code} or signal ${signal} !`)
      cb()
    }

    onStart (cb) {

      const http = require('http').Server(app)

      app.get('/ok', function(req, res) {
        res.send('Ok')
      });

      http.listen(process.env.PORT || 3000, function(){
        console.log('Server express', 'listening on port', http.address().port)
        cb()
      });
    }
}

new MyEntrypoint()
```

### Configuration

You can write your own configuration like you do for @pm2/io, just add a conf() method into your entrypoint which returns a json object.
Details of configuration can be found in this section : [**Configuration**](#configuration)

```javascript
const io = require('@pm2/io')

class MyEntrypoint extends io.Entrypoint {

    ...

    conf() {
      return {
        ...
      }
    }
}

new MyEntrypoint()
```

### Access @pm2/io features

Entrypoint allow access to an instance of @pm2/io. So you can use all features described above by calling this.io.

```javascript
const app = require('express')()
const io = require('@pm2/io')

class MyEntrypoint extends io.Entrypoint {

    onStart (cb) {

      const http = require('http').Server(app)

      app.get('/ok', function(req, res) {
        res.send('Ok')
      });

      const counter = this.io.counter('start')

      http.listen(process.env.PORT || 3000, () => {
        console.log('Server express', 'listening on port', http.address().port)
        counter.inc()
        cb()
      });
    }
}

new MyEntrypoint()
```

### Actions et Metrics

You can group all your actions and all your metrics into one methods.
Use actions() and metrics(), their will be automatically called by the entrypoint.

```javascript
const io = require('@pm2/io')

class MyEntrypoint extends io.Entrypoint {

    ...

    actions() {
      this.io.action('db:clean', (cb) => {
        clean.db(() => {
          /**
           * cb() must be called at the end of the action
           */
           cb({ success: true });
        });
      })
    }

    metrics() {
      this.myMetric = io.metric('Inline');
    }
}

new MyEntrypoint()
```

## Development

To auto rebuild on file change:

```bash
$ npm install
$ npm run watch
```

To test only one file:

```bash
$ npm run unit <typescript-file-to-test.ts>
```

Run transpilation + test + coverage:

```bash
$ npm run test
```

Run transpilation + test only:

```bash
$ npm run unit <test>
```

## Publishing

Just run :
```bash
$ npm publish
```

And for beta
```bash
$ npm publish --tag beta
```


## License

MIT
