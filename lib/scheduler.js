'use strict';

var Quartz = require('quartz-scheduler');
var uuid = require('uuid');

var name = 'quartz-scheduler';

var scheduler;

module.exports = function(options) {
  var seneca = this;

  seneca.add({role: 'scheduler', cmd: 'register'}, function(args, done) {

    var taskId = uuid.v4();

    scheduler.schedule(taskId, args.when, args.data, function(err, jobId) {
      seneca.log.debug('Scheduled job', taskId);
      done(err);
    });

    scheduler.on(taskId, function(data, callback) {
      seneca.log.debug('Executing job', taskId);
      args.task();
      callback();
    });

  });

  seneca.add({init: name}, function(args, done) {
    scheduler = new Quartz();
    scheduler.start(done);
  });

  return {
    name: name
  }
}
