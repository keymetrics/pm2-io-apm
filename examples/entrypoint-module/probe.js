var pmx     = require('@pm2/io');
var Entrypoint = require('@pm2/io').Entrypoint;
var pm2     = require('pm2');
var fs      = require('fs');
var path    = require('path');
var shelljs = require('shelljs');
var findprocess = require('find-process');

class App extends Entrypoint {
  onStart(cb) {
    this.initModule({
      pid              : this.getPID(path.join(process.env.HOME, '.pm2', 'agent.pid')),
      widget : {
        type: 'generic',
        theme: ['#1d3b4a', '#1B2228', '#22bbe2', '#22bbe2'],
        logo: 'https://raw.githubusercontent.com/Unitech/pm2/master/pres/pm2-v4.png',
        pid: this.getPID(path.join(process.env.HOME, '.pm2', 'pm2.pid')),

        el : {
          probes  : true,
          actions : true
        },

        block : {
          errors           : true,
          main_probes : ['events rcvd/min', 'Agent Count', 'Version'],
          latency          : false,
          versioning       : false,
          show_module_meta : false
        }
      }
    })

    console.log('Monitoring agent initialized')
    cb()
  }

  actuators () {
    this.action('pm2 list', function(reply) {
      pm2.list(function(err, procs) {
        reply(procs)
      })
    })

    this.action('pm2 link info', function(reply) {
      shelljs.exec('pm2 link info', function(err, stdo, stde) {
        reply({err, stdo, stde})
      })
    })
  }

  sensors () {
    console.log('Building sensors and integrations')

    var version, pm2_procs, proc_nb

    /**
     * Events sent from PM2 to the Agent
     */
    var event_metric = this.meter({
      name : 'events rcvd/min'
    })

    pm2.connect(function() {
      pm2.launchBus(function(err, bus) {
        bus.on('*', function(event, data) {
          if (event.indexOf('log:') > -1)
            event_metric.mark();
        });
      });

      setInterval(function() {
        pm2.list(function(err, procs) {
          pm2_procs = procs.length;
        });
      }, 2000);
    });

    /**
     * Agent Count metric + Version retrieval and integration
     */
    this.metric({
      name  : 'Agent Count',
      alert : {
        mode : 'threshold-avg',
        value : 2,
        cmp : '>'
      },
      value : function() {
        return proc_nb;
      }
    })

    this.metric({
      name  : 'Version',
      value : function() {
        return version;
      }
    })

    setInterval(function() {
      findprocess('name', 'PM2 Agent')
        .then(function (list) {
          proc_nb = 0
          list.filter(proc => {
            if (proc.cmd.indexOf(path.join(process.env.HOME, '.pm2')) > -1) {
              version = proc.cmd.split(' ')[2]
              proc_nb++
            }
          })
        });
    }, 5000)
  }


  onStop(err, cb) {
    pm2.disconnect(cb)
  }
}

new App()
