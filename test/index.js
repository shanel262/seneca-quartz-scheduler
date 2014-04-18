var seneca = require('seneca')();
var moment = require('moment');
var expect = require('chai').expect;

var role = 'scheduler';
seneca.use('../lib/scheduler.js');

it('should register a task', function (done) {
  var registeredAt;

  seneca.ready(function() {
    seneca.act({
      role: role,
      cmd: 'register',
      when: moment().add('seconds', 1).toDate(),
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
