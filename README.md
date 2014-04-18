# seneca-quartz-scheduler

A scheduler plugin for the [Seneca](http://senecajs.org) toolkit that wraps [node-quartz-scheduler](https://github.com/nherment/node-quartz-scheduler).

Quartz does not expose HTTP services by itself - you'll need to build (maven) a war file from [quartz-http](https://github.com/nherment/quartz-http).

## Support

If you're using this module, feel free to contact me on twitter if you
have any questions! :) [@darsee](http://twitter.com/darsee)

Current Version: 0.0.0

Tested on: node 0.10.26, seneca 0.5.15



## Quick examples

Schedule a single future event:

```
var seneca = require('seneca')();

seneca.use('quartz-scheduler');

seneca.ready(function(err){
  if( err ) return console.log(err);

  seneca.act({
    role:'scheduler',
    cmd:'register',
    when: new Date(2014, 5, 1),
    task: function () {
      console.log('do something');
    },
  })

})
```

## Install

```
npm install seneca
npm install seneca-quartz-scheduler
```

You'll need the [seneca](http://github.com/rjrodger/seneca) module to use this module - it's just a plugin.


## Usage

To load the plugin:

```
seneca.use('quartz-scheduler', { ... options ... })
```

For available options, see [node-quartz-scheduler](https://github.com/nherment/node-quartz-scheduler).


## Actions

All actions provide results via the standard callback format: <code>function(error,data){ ... }</code>.


### ACTION: role:scheduler, cmd:register

Register a task with the scheduler.

#### Arguments:

   * _when_: a Date object
   * _task_: A function to call when the time is right
   * _data_: additional data

## Logging

To see what this plugin is doing, try:

```
node your-app.js --seneca.log=plugin:quartz-scheduler
```

This will print action logs and plugin logs for the user plugin. To skip the action logs, use:

```
node your-app.js --seneca.log=type:plugin,plugin:quartz-scheduler
```

For more logging options, see the [Seneca logging tutorial](http://senecajs.org/logging-example.html).


## Test

Run tests with:

```
npm test
```