var seneca = require('seneca')();
var moment = require('moment');
var expect = require('chai').expect;
var debug = require('debug')('test:seneca-quartz-scheduler');

var config = {
  // When testing, change the URL to where your scheduler is running
  quartzURL: 'http://127.0.0.1:8090/scheduler/api'
};

var role = 'scheduler';

seneca.use('../lib/scheduler.js', config);

it('should register a task', function (done) {
  var registeredAt;

  seneca.ready(function() {
    seneca.act({
      role: role,
      cmd: 'register',
      when: moment().add(1, 'seconds').toDate(),
      task: function () {
        var now = Date.now();
        expect(now).to.be.above(registeredAt);
        done();
      }
    }, function (err) {
      registeredAt = Date.now()
      expect(err).to.be.null;
    });
  });

});
