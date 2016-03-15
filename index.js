var fs = require('fs');
var hapi = require('hapi');
var pg = require('pg');
var boom = require('boom');
var pg_copy = require('pg-copy-streams');
var hstore = require('pg-hstore')();
var queue = require('queue-async');
var reformatCsv = require('./lib/reformat-csv');
var queries = require('./lib/queries');
var get = require('./src/get');
var post = require('./src/post');

var user = process.env.DBUsername || 'postgres';
var password = process.env.DBPassword || '';
var address = process.env.DBAddress || 'localhost';
var database = process.env.Database || 'tofix';
var path = process.env.UploadPath;

// short term, to prevent the need from building out user authentication until later
var uploadPassword = process.env.UploadPassword;

if (!path) return console.log('env variable UploadPath must be set');
if (!uploadPassword) return console.log('env variable UploadPassword must be set');

// from the db connection
var client, done;

// seconds to lock each item
var lockPeriod = 600;

var conString = 'postgres://' +
  user + ':' +
  password + '@' +
  address + '/' +
  database;

var server = new hapi.Server();
var port = 8000;

server.connection({
  port: port,
  routes: {
    cors: true
  }
});

var tasks = {};

server.route({
  method: 'GET',
  path: '/status',
  handler: function(request, reply) {
    pg.connect(conString, function(err, c, d) {
      if (err) {
        reply('error').code(500);
      } else {
        reply({
          status: 'a ok'
        });
      }
      c.end();
    });
  }
});

server.route({
  method: 'GET',
  path: '/sends-errors',
  handler: function(request, reply) {
    reply('error').code(500);
  }
});

server.route({
  method: 'POST',
  path: '/track/{task}',
  handler: function(request, reply) {
    var table = request.params.task.simplify();
    var attributes = request.payload.attributes;
    if (!attributes) return reply(boom.badRequest('missing attributes'));
    // don't wait
    reply();
    post.track(client, table, request.payload.time, attributes, function(err, results) {
      if (err) console.error('/track err', err);
    });
  }
});

server.route({
  method: 'GET',
  path: '/count/{task}',
  handler: function(request, reply) {
    var table = tasks[request.params.task.simplify()];
    get.count(client, request, reply, table);
  }
});

server.route({
  method: 'GET',
  path: '/count_history/{task}/{grouping}',
  handler: function(request, reply) {
    var table = request.params.task.simplify();
    get.count_history(client, request, reply, table);
  }
});

server.route({
  method: 'GET',
  path: '/track/{task}/{key}:{value}/{to?}',
  handler: function(request, reply) {
    var table = request.params.task.simplify();
    get.track(client, request, reply, table);
  }
});

server.route({
  method: 'GET',
  path: '/track_stats/{task}/{from}/{to}',
  handler: function(request, reply) {
    var table = request.params.task.simplify();
    get.track_stats(client, request, reply, table);
  }
});

server.route({
  method: 'POST',
  path: '/task/{task}',
  handler: function(request, reply) {
    var table = tasks[request.params.task.simplify()];
    post.task(client, request, reply, lockPeriod, table);
  }
});

server.route({
  method: 'POST',
  path: '/fixed/{task}',
  config: {
    payload: {
      output: 'data'
    }
  },
  handler: function(request, reply) {
    var table = tasks[request.params.task.simplify()];
    post.fixed(client, request, reply, table);
  }
});

server.route({
  method: 'POST',
  path: '/noterror/{task}',
  config: {
    payload: {
      output: 'data'
    }
  },
  handler: function(request, reply) {
    var table = tasks[request.params.task.simplify()];
    post.noterror(client, request, reply, table);
  }
});

server.route({
  method: 'GET',
  path: '/detail/{idtask}',
  handler: function(request, reply) {
    get.detail(client, request, reply);
  }
});

server.route({
  method: 'GET',
  path: '/tasks',
  handler: function(request, reply) {
    get.tasks(client, request, reply);
  }
});

server.route({
  method: 'POST',
  path: '/csv',
  config: {
    payload: {
      maxBytes: 200000000,
      output: 'stream',
      parse: true
    }
  },
  handler: function(request, reply) {
    post.csv(client, request, reply, function(results) {
      load_tasks(results.status);
      return reply(JSON.stringify({
        taskid: results.taskid
      }));
    });
  }
});


function load_tasks(status) {
  if (status) {
    tasks = {};
    var query = 'SELECT id, tasktable FROM task_details ORDER BY status, title;';
    var cliente = client.query(query, function(err, results) {
      results.rows.forEach(function(row) {
        tasks[row.id] = row.tasktable;
      });
    });
  }
}

String.prototype.simplify = function() {
  return this.replace(/[^a-zA-Z]+/g, '').toLowerCase();
};

pg.connect(conString, function(err, c, d) {
  if (err) return console.log(err);
  console.log('connected to:', address);
  client = c;
  done = d;
  server.start(function() {
    console.log('server on port', port);
    load_tasks(true);
  });
});