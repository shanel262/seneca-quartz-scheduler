'use strict';

var Quartz = require('quartz-scheduler');
var uuid = require('uuid')

var name = 'quartz-scheduler';


var scheduler;

module.exports = function(options) {
  var seneca = this;
  options = options || {};

  /** This unique id is to be able to differentiate the plugins instances if
   * multiple of them are used. (eg: multiple quartz clusters)
   */
  var schedulerUniqueId = options.uid || name;

  seneca.add({role: 'scheduler', cmd: 'register'}, function(args, done) {
    seneca.log.debug('task about to be scheduled', JSON.stringify(args));

    scheduler.schedule(schedulerUniqueId, args.when, args.args, function(err, jobId) {
      seneca.log.debug('Scheduled job', jobId);
      var scheduledTask = {
        when: args.when,
        args: args.args,
        jobId: jobId
      };
      done(err, scheduledTask);
    });

  });

  seneca.add({role: 'scheduler', cmd: 'update'}, function(args, done) {
    seneca.log.debug('task about to be updated', args);

    scheduler.update(schedulerUniqueId, args.when, args.args, args.jobId, function(err, jobId) {
      seneca.log.debug('Updated job', jobId);
      var scheduledTask = {
        when: args.when,
        args: args.args,
        jobId: jobId
      };
      done(err, scheduledTask);
    });

  });

  seneca.add({role: 'scheduler', cmd: 'deregister'}, function(args, done) {
    seneca.log.debug('about to be deregister a task', args);

    scheduler.cancel(args.jobId, function(err, result) {
      if(err) {
        seneca.log.error('job deregister failed', err);
        return done(err, result);
      }
      seneca.log.debug('job canceled', (result ? result.name : 'not found'));
      done(err, result);
    });
  });

  seneca.add({init: name}, function(args, done) {
    scheduler = new Quartz(options);
    scheduler.start(function() {
      scheduler.addListener(schedulerUniqueId, function(jobId, args, callback) {
        seneca.log.info('scheduler triggering action', args);
        args.jobId = jobId;
        seneca.act(args, callback);
      });
      done();
    });
  });

  return {
    name: name
  };
};
