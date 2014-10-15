var seneca = require('seneca')();
var moment = require('moment');
var should = require('chai').should();
var uuid = require('uuid');

var config = {
  // When testing, change the URL to where your scheduler is running
  quartzURL: 'http://127.0.0.1:8080/scheduler/api'
};

var role = 'scheduler';

seneca.use('../lib/scheduler.js', config);

describe('quartz events', function() {

  var testCallbacks = {};

  before(function(done) {
    seneca.ready(done);
  });

  it('should register a task and have it execute a second later', function (done) {
    var registeredAt;
    var callbackCount = 0;
    var cmdId = uuid.v4();
    seneca.add({role:role, cmd:cmdId}, function(args, callback){
      var now = Date.now();
      now.should.be.above(registeredAt);
      args.data.one.should.equal('#1');
      args.data.two.should.equal('#2');
      callback();
      done();
    });

    seneca.act({
      role: role,
      cmd: 'register',
      when: moment().add(1, 'seconds').toDate(),
      args: { role: role, cmd: cmdId, data: {one:'#1',two: '#2'}}
    }, function (err, data) {

      registeredAt = Date.now();
      should.not.exist(err);
    });
  });

  var taskData;

  it('should register a task that will be deregistered later', function (done) {
    var funcId = uuid.v4();


    var cmdId = uuid.v4();
    seneca.add({role: role, cmd: cmdId}, function(args, callback) {
      // This should never be called because we're going to deregister it before it
      // is called so throw an error if it's called.
      throw new Error('This function should not have been called.');
    });

    seneca.ready(function () {
      seneca.act({
        role: role,
        cmd: 'register',
        when: moment().add(10, 'minutes').toDate(),
        args: {role: role, cmd: cmdId, data: {some: 'random data'}}
      }, function (err, data) {
        should.not.exist(err);
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
        jobId: taskData.jobId
      }, function (err, data) {
        should.not.exist(err);
        data = JSON.parse(data);
        data.key.should.equal('true');
        done();
      });
    });
  });

  it('should register a task that will be updated in next test', function (done) {
    var funcId = uuid.v4();

    var cmdId = uuid.v4();
    seneca.add({role: role, cmd: cmdId}, function(args, callback) {
      // This should never be called because we're going to update it before it
      // is called so throw an error if it's called and give it a different
      // identifier in its payload
      throw new Error('This function should not have been called.');
    });

    seneca.ready(function () {
      seneca.act({
        role: role,
        cmd: 'register',
        when: moment().add(10, 'minutes').toDate(),
        args: {role: role, cmd: cmdId, data: {funcId: funcId, payload_number: '#1'}}
      }, function (err,data) {
        should.not.exist(err);
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

    var cmdId = uuid.v4();
    seneca.add({role: role, cmd: cmdId}, function(args, callback) {
      args.data.payload_number.should.equal('#2');
      done();
    });

    seneca.ready(function () {
      seneca.act({
        role: role,
        cmd: 'update',
        when: moment().add(2, 'seconds').toDate(),
        jobId: taskData.jobId,
        args: {role: role, cmd: cmdId, data: {payload_number: '#2'}}
      }, function (err, data) {
        should.not.exist(err);
        should.exist(data);
        should.exist(data.jobId);
        taskData = data;
      });
    });
  });

});
