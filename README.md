<div align="center">
  <a href="http://pm2.keymetrics.io">
    <img width=411px src="https://raw.githubusercontent.com/keymetrics/pmx/master/pres/logo.png">
  </a>
  <br/>
  <b><a href="https://github.com/Unitech/pm2">PM2</a> programmatic integration</b>
  <br/>
  <br/>
  <a href="https://www.bithound.io/github/keymetrics/pmx">
<img src="https://www.bithound.io/github/keymetrics/pmx/badges/score.svg"/>
  </a>
  <a href="https://travis-ci.org/keymetrics/pmx">
<img src="https://api.travis-ci.org/keymetrics/pmx.png?branch=master"/>
  </a>
<br/>
<br/>
</div>


PMX allows you to create advanced interactions with [PM2](https://github.com/Unitech/pm2) and [Keymetrics.io](https://app.keymetrics.io/).

# Table of Contents

- [**Installation**](https://github.com/keymetrics/pmx-2/blob/master/README.md#installation)
- [**Expose Custom Metrics**](https://github.com/keymetrics/pmx-2#expose-metrics-measure-anything)
- [**Expose Triggerable Runtime Functions**](https://github.com/keymetrics/pmx-2#expose-functions-trigger-functions-remotely)
- [**Report Exceptions and Alerts**](https://github.com/keymetrics/pmx-2#alert-system-for-custom-metrics)
- [**Report Custom Events**](https://github.com/keymetrics/pmx-2#emit-events)
- [**Monitor network traffic**](https://github.com/keymetrics/pmx-2#application-level-network-traffic-monitoring--display-used-ports)
- [**Development**](https://github.com/keymetrics/pmx-2#application-level-network-traffic-monitoring--display-used-ports)


# Installation

Install pmx with npm:

```bash
$ npm install pmx.io --save
```

## Expose Metrics: Measure anything

PMX allows you to expose code metrics from your code to the PM2 monit command or the Keymetrics Dashboard, in realtime and over time.

4 measurements are available:

- **Simple metrics**: Values that can be read instantly
    - eg. Monitor variable value
- **Counter**: Things that increment or decrement
    - eg. Downloads being processed, user connected
- **Meter**: Things that are measured as events / interval
    - eg. Request per minute for a http server
- **Histogram**: Keeps a reservoir of statistically relevant values biased towards the last 5 minutes to explore their distribution
    - eg. Monitor the mean of execution of a query into database

### Metric: Simple value reporting

This allow to expose values that can be read instantly.

```javascript
const pmx = require('pmx.io');

// Here the value function will be called each second to get the value
// returned by Object.keys(users).length
const metric = pmx.metric({
  name    : 'Realtime user',
  type    : 'metric',
  value   : function() {
    return Object.keys(users).length;
  }
})['Realtime_user'];

// Here we are going to call valvar.set() to set the new value
const {Realtime_Value} = pmx.metric({
  name    : 'Realtime Value'
});

Realtime_Value.set(23);
```

#### Options

- **name**: Probe name
- **value**: (optional) function that allows to monitor a global variable

### Counter: Sequential value change

Things that increment or decrement.

```javascript
const pmx = require('pmx.io');

// The counter will start at 0
const {Current_req_processed} = pmx.metric({
  name : 'Current req processed',
  type : 'counter',
});

http.createServer(function(req, res) {
  // Increment the counter, counter will eq 1
  Current_req_processed.inc();
  req.on('end', function() {
    // Decrement the counter, counter will eq 0
    Current_req_processed.dec();
  });
});
```

#### Options

- **name**: Probe name

### Meter: Average calculated values

Things that are measured as events / interval.

```javascript
const pmx = require('pmx.io');

const {reqsec} = pmx.metric({
  name      : 'req/sec',
  type      : 'meter',
  samples   : 1  // This is per second. To get per min set this value to 60
});

http.createServer(function(req, res) {
  reqsec.mark();
  res.end({success:true});
});
```

#### Options

- **name**: Probe name
- **samples**: (optional)(default: 1) Rate unit. Defaults to **1** sec.
- **timeframe**: (optional)(default: 60) timeframe over which events will be analyzed. Defaults to **60** sec.

### Histogram

Keeps a reservoir of statistically relevant values biased towards the last 5 minutes to explore their distribution.

```javascript
const pmx = require('pmx.io');

const {latency} = pmx.metric({
  name        : 'latency',
  type        : 'histogram',
  measurement : 'mean'
});

const latencyValue = 0;

setInterval(function() {
  latencyValue = Math.round(Math.random() * 100);
  latency.update(latencyValue);
}, 100);
```

#### Options

- **name**: Probe name
- **agg_type** : (optional)(default: none) Can be `sum`, `max`, `min`, `avg` (default) or `none`. It will impact the way the probe data are aggregated within the **Keymetrics** backend. Use `none` if this is irrelevant (eg: constant or string value).

## Expose Functions: Trigger Functions remotely

Remotely trigger functions from Keymetrics. These metrics takes place in the main Keymetrics Dashboard page under the Custom Action section.

### Simple actions

Simple action allows to trigger a function from Keymetrics. The function takes a function as a parameter (reply here) and need to be called once the job is finished.

Example:

```javascript
const pmx = require('pmx.io');

pmx.action('db:clean', function(reply) {
  clean.db(function() {
    /**
     * reply() must be called at the end of the action
     */
     reply({success : true});
  });
});
```

### Scoped actions (beta)

Scoped Actions are advanced remote actions that can be also triggered from Keymetrics.

Two arguments are passed to the function, data (optional data sent from Keymetrics) and res that allows to emit log data and to end the scoped action.

Example:

```javascript
pmx.scopedAction('long running lsof', function(data, res) {
  var child = spawn('lsof', []);

  child.stdout.on('data', function(chunk) {
    chunk.toString().split('\n').forEach(function(line) {
      res.send(line); // This send log to Keymetrics to be saved (for tracking)
    });
  });

  child.stdout.on('end', function(chunk) {
    res.end('end'); // This end the scoped action
  });

  child.on('error', function(e) {
    res.error(e);  // This report an error to Keymetrics
  });

});
```

## Report Alerts: Errors / Uncaught Exceptions

**(Specific to Keymetrics)**

By default once PM2 is linked to Keymetrics, you will be alerted of any uncaught exception.
These errors are accessible in the **Issue** tab of Keymetrics.

### Custom alert notification

If you need to alert about any critical errors you can do it programmatically:

```javascript
const pmx = require('pmx.io');

pmx.notify({ success : false });

pmx.notify('This is an error');

pmx.notifyError(new Error('This is an error'));
```

## Emit Events

Emit events and get historical and statistics.
This is available in the **Events** page of Keymetrics.

```javascript
const pmx = require('pmx.io');

pmx.emit('user:register', {
  user : 'Alex registered',
  email : 'thorustor@gmail.com'
});
```

## Application level network traffic monitoring / Display used ports

You can monitor the network usage of a specific application by adding the option `network: true` when initializing PMX. If you enable the flag `ports: true` when you init pmx it will show which ports your app is listenting on.

These metrics will be shown in the Keymetrics Dashboard in the Custom Metrics section.

Example:

```javascript
pmx.init({
  metrics: {
    network : {
      traffic : true, // Allow application level network monitoring
      ports   : true  // Display ports used by the application
    }
  }
});
```

## Advanced PMX configuration


```javascript
const pmx = require('pmx.io').init({

  metrics: {
    eventLoopActive: true, // (default: true) Monitor active handles and active requests
    eventLoopDelay: true,  // (default: true) Get event loop's average delay
  
    deepMetrics: {
      mongo: true,     // (default: true) Mongo connections monitoring
      mysql: true,     // (default: true) MySQL connections monitoring
      mqtt: true,      // (default: true) Mqtt connections monitoring
      socketio: true,  // (default: true) WebSocket monitoring
      redis: true,     // (default: true) Redis monitoring
      http: true,      // (default: true) Http incoming requests monitoring
      https: true,     // (default: true) Https incoming requests monitoring
      "http-outbound": true, // (default: true) Http outbound requests monitoring
      "https-outbound": true // (default: true) Https outbound requests monitoring
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

    network : {       // Network monitoring at the application level
      traffic : true, // (default: true) Allow application level network monitoring
      ports   : true  // (default: false) Shows which ports your app is listening on
    },

    // Transaction Tracing system configuration
    transaction  : {
      http : true,              // (default: true) HTTP routes logging
      tracing: {                // (default: false) Enable transaction tracing
        http_latency: 1,        // (default: 200) minimum latency in milliseconds to take into account
        ignore_routes: ['/foo'] // (default: empty) exclude some routes
      }
    }
  },
  
  actions: {
    eventLoopDump: false, // (default: false) Enable event loop dump action
    profilingCpu: true,   // (default: true) Enable CPU profiling actions
    profilingHeap: true   // (default: true) Enable Heap profiling actions
  }
});
```

## Development

To auto rebuild on file change:

```bash
$ npm install
$ npm run watch
```

## Publishing

TODO


## License

MIT
