var seneca = require('seneca')();
var moment = require('moment');
var should = require('chai').should();
var debug = require('debug')('seneca-quartz-scheduler:test');
var uuid = require('uuid');

var config = {
  // When testing, change the URL to where your scheduler is running
  quartzURL: 'http://127.0.0.1:8090/scheduler/api'
};

var role = 'scheduler';

seneca.use('../lib/scheduler.js', config);

describe('quartz events', function() {

  var testCallbacks = {};

  // We add the scheduler/event "listener" to receive scheduled
  // jobs from the node-quartz-scheduler.
  // In order to be able to run multiple tests and not add multiple
  // of these "listeners" (which we could and then arbitrate among
  // them) we are going to pass a UUID as a funcId into
  // the data object that is passed through the scheduler and use
  // that to index into a function setup by each test.
  // This is similar to how you might use it in production code
  // if you want to listen to multiple types of scheduled jobs
  // except you probably wouldn't use functions but rather other
  // seneca micro services as targets.
  seneca.add({role:role, cmd:'event'}, function(args, callback){
    debug('event received, args follow:');
    debug(args);
    if(!testCallbacks[args.data.funcId]) {
      throw Error('Unfound function against this id: ' + args.data.funcId);
    }
    testCallbacks[args.data.funcId](args);
    return this.prior(args,callback);
  });

  it('should register a task and have it execute a second later', function (done) {
    var registeredAt;
    var callbackCount = 0;
    var funcId = uuid.v4();

    testCallbacks[funcId] = function(args){
      var now = Date.now();
      now.should.be.above(registeredAt);
      args.data.one.should.equal('#1');
      args.data.two.should.equal('#2');
      args.name.should.equal('Test Name #1');
      if(++callbackCount == 2) {
        done();
      }
    };

    seneca.ready(function () {
      seneca.act({
        role: role,
        cmd: 'register',
        when: moment().add(1, 'seconds').toDate(),
        name: 'Test Name #1',
        data: {one:'#1',two: '#2', funcId: funcId}
      }, function (err, data) {
        debug('Registered task:');
        debug(data);
        registeredAt = Date.now();
        should.not.exist(err);
        if(++callbackCount == 2) {
          done();
        }
      });
    });
  });

  var taskData;

  it('should register a task that will be deregistered later', function (done) {
    var funcId = uuid.v4();

    testCallbacks[funcId] = function(){
      // This should never be called because we're going to deregister it before it
      // is called so throw an error if it's called.
      throw Error('This function should not have been called.');
    };

    seneca.ready(function () {
      seneca.act({
        role: role,
        cmd: 'register',
        when: moment().add(10, 'minutes').toDate(),
        data: {some: 'random data', funcId: funcId}
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
        jobId: taskData.jobId
      }, function (err, data) {
        should.not.exist(err);
        debug('deregister result:');
        data = JSON.parse(data);
        debug(data);
        data.key.should.equal('true');
        done();
      });
    });
  });

  it('should register a task that will be updated in next test', function (done) {
    var funcId = uuid.v4();

    testCallbacks[funcId] = function(){
      // This should never be called because we're going to update it before it
      // is called so throw an error if it's called and give it a different
      // identifier in its payload
      throw Error('This function should not have been called.');
    };

    seneca.ready(function () {
      seneca.act({
        role: role,
        cmd: 'register',
        when: moment().add(10, 'minutes').toDate(),
        data: {funcId: funcId, payload_number: '#1'}
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
    var funcId = uuid.v4();

    testCallbacks[funcId] = function(args){
      args.data.payload_number.should.equal('#2');
      if(++callbackCount == 2) {
        done();
      }
    };

    seneca.ready(function () {
      seneca.act({
        role: role,
        cmd: 'update',
        when: moment().add(2, 'seconds').toDate(),
        jobId: taskData.jobId,
        data: {funcId: funcId, payload_number: '#2'}
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
