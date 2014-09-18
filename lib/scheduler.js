'use strict';

var Quartz = require('quartz-scheduler');
var uuid = require('uuid');
var debug = require('debug')('seneca-quartz-scheduler');

var name = 'quartz-scheduler';

var scheduler;

module.exports = function(options) {
  var seneca = this;

  seneca.add({role: 'scheduler', cmd: 'register'}, function(args, done) {
    debug('task about to be scheduled:');
    debug(Object.keys(args));
    debug(args);

    var taskId = uuid.v4();

    scheduler.schedule(taskId, args.when, args.data, function(err, jobId) {
      seneca.log.debug('Scheduled job', taskId);
      debug('job scheduled, taskId: %s, jobId: %s', taskId, jobId);
      var scheduledTask = {
        when: args.when,
        data: args.data,
        taskId: taskId,
        jobId: jobId
      };
      done(err, scheduledTask);
    });

    scheduler.on(taskId, function(data, callback) {
      seneca.log.debug('Executing job', taskId);
      args.task();
      callback();
    });

  });

  seneca.add({role: 'scheduler', cmd: 'unregister'}, function(args, done) {
    this.act({role: 'scheduler', cmd: 'deregister'}, args, done);
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
      seneca.log.debug('job canceled', taskId);
      debug('job canceled, result follows:');
      debug(result);
      done(err, result);
    });
  });

  seneca.add({init: name}, function(args, done) {
    debug('init called');
    scheduler = new Quartz(options);
    scheduler.start(done);
  });

  return {
    name: name
  };
};
