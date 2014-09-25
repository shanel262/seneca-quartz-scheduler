'use strict';

var Quartz = require('quartz-scheduler');
var debug = require('debug')('seneca-quartz-scheduler:scheduler');

var name = 'quartz-scheduler';

var scheduler;

module.exports = function(options) {
  var seneca = this;

  seneca.add({role: 'scheduler', cmd: 'register'}, function(args, done) {
    debug('task about to be scheduled:');
    debug(Object.keys(args));
    debug(args);

    var name = args.name;

    scheduler.schedule(name, args.when, args.data, function(err, jobId) {
      seneca.log.debug('Scheduled job', name);
      debug('job scheduled, name: %s, jobId: %s', name, jobId);
      var scheduledTask = {
        when: args.when,
        data: args.data,
        name: name,
        jobId: jobId
      };
      debug(scheduledTask);
      done(err, scheduledTask);
    });

  });

  seneca.add({role: 'scheduler', cmd: 'update'}, function(args, done) {
    debug('task about to be updated:');
    debug(Object.keys(args));
    debug(args);

    var name = args.name;

    scheduler.update(name, args.when, args.data, {key: args.jobId}, function(err, jobId) {
      seneca.log.debug('Updated job', name);
      debug('job updated, name: %s, jobId: %s', name, jobId);
      var scheduledTask = {
        when: args.when,
        data: args.data,
        name: name,
        jobId: jobId
      };
      debug(scheduledTask);
      done(err, scheduledTask);
    });

  });

  seneca.add({role: 'scheduler', cmd: 'deregister'}, function(args, done) {
    debug('about to be deregister a task:');
    debug(Object.keys(args));
    debug(args);

    scheduler.cancel(args.jobId, function(err, result) {
      if(err) {
        seneca.log.error('job deregister failed', err);
        debug('error when deregistering a job:');
        debug(err);
        return done(err, result);
      }
      seneca.log.debug('job canceled', (result ? result.name : ''));
      debug('job canceled, result follows:');
      debug(result);
      done(err, result);
    });
  });

  seneca.add({init: name}, function(args, done) {
    debug('init called');
    scheduler = new Quartz(options);
    scheduler.start(function() {
      // Replace the scheduler's emit function with our own so that we can capture all
      // events and route them to the seneca scheduler/event micro service.
      // If a micro service needs to act on quartz scheduler events then it should register this
      // by calling seneca.add({role: 'scheduler', cmd: 'event'}, etc...
      // and then determining if the event is for it to act on based on the name of the event.
      // This will also allow multiple micro services to act on the same event if appropriate.
      scheduler.emit = function(name, data, callback) {
        var args = {
          name: name,
          data: data
        };
        seneca.act('role:scheduler,cmd:event', args, callback);
      };
      done();
    });
  });

  return {
    name: name
  };
};
