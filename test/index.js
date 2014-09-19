var seneca = require('seneca')();
var moment = require('moment');
var expect = require('chai').expect;
var should = require('chai').should();
var debug = require('debug')('test:seneca-quartz-scheduler');

var config = {
  // When testing, change the URL to where your scheduler is running
  quartzURL: 'http://127.0.0.1:8090/scheduler/api'
};

var role = 'scheduler';

seneca.use('../lib/scheduler.js', config);

describe('quartz events', function(){

  it('should register a task and have it execute a second later', function (done) {
    var registeredAt;

    seneca.ready(function () {
      seneca.act({
        role: role,
        cmd: 'register',
        when: moment().add(1, 'seconds').toDate(),
        task: function (data) {
          debug('task executed:');
          debug(data);
          var now = Date.now();
          expect(now).to.be.above(registeredAt);
          done();
        },
        random: {gold: 'color'}
      }, function (err, data) {
        debug('Registered task:');
        debug(data);
        registeredAt = Date.now();
        expect(err).to.be.null;
      });
    });
  });

  var taskData;
  var delayedTaskExecuted = false;
  var delayedTask = function() {
    delayedTaskExecuted = true;
  };

  it('should register a task that will be deregistered later', function (done) {

    seneca.ready(function () {
      seneca.act({
        role: role,
        cmd: 'register',
        when: moment().add(10, 'minutes').toDate(),
        task: delayedTask
      }, function (err,data) {
        should.not.exist(err);
        debug('task registered:');
        debug(data);
        should.exist(data);
        should.exist(data.jobId);
        taskData = data;
        done();
      });
    });
  });

  it('should deregister a task', function (done) {

    seneca.ready(function () {
      seneca.act({
        role: role,
        cmd: 'deregister',
        jobId: taskData.jobId,
        taskId: taskData.taskId
      }, function (err, data) {
        should.not.exist(err);
        debug('deregister result:');
        debug(data);
        delayedTaskExecuted.should.equal(false);
        done();
      });
    });
  });

  it('should register a task that will be updated later', function (done) {

    seneca.ready(function () {
      seneca.act({
        role: role,
        cmd: 'register',
        when: moment().add(10, 'minutes').toDate(),
        task: delayedTask
      }, function (err,data) {
        should.not.exist(err);
        debug('task registered:');
        debug(data);
        should.exist(data);
        should.exist(data.jobId);
        taskData = data;
        done();
      });
    });
  });

  it('should update a task to fire in 2 seconds and receive the notification', function (done) {
    this.timeout(5000);
    var callbackCount = 0;
    var firedTask = function() {
      if(++callbackCount == 2) {
        done();
      }
    };
    seneca.ready(function () {
      seneca.act({
        role: role,
        cmd: 'update',
        when: moment().add(2, 'seconds').toDate(),
        task: firedTask,
        jobId: taskData.jobId,
        taskId: taskData.taskId
      }, function (err,data) {
        should.not.exist(err);
        debug('task updated:');
        debug(data);
        should.exist(data);
        should.exist(data.jobId);
        taskData = data;
        if(++callbackCount == 2) {
          done();
        }
      });
    });
  });

});
