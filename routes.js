var pg = require('pg');
var boom = require('boom');
var get = require('./src/get');
var post = require('./src/post');

var routes = function(client, conString, lockPeriod, tasks) {
  load_tasks(true);
  return [{
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
  }, {
    method: 'GET',
    path: '/tasks',
    handler: function(request, reply) {
      get.tasks(client, request, reply);
    }
  }, {
    method: 'GET',
    path: '/sends-errors',
    handler: function(request, reply) {
      reply('error').code(500);
    }
  }, {
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
  }, {
    method: 'GET',
    path: '/count/{task}',
    handler: function(request, reply) {
      var table = tasks[request.params.task.simplify()];
      get.count(client, request, reply, table);
    }
  }, {
    method: 'GET',
    path: '/count_history/{task}/{grouping}',
    handler: function(request, reply) {
      var table = request.params.task.simplify();
      get.count_history(client, request, reply, table);
    }
  }, {
    method: 'GET',
    path: '/track/{task}/{key}:{value}/{to?}',
    handler: function(request, reply) {
      var table = request.params.task.simplify();
      get.track(client, request, reply, table);
    }
  }, {
    method: 'GET',
    path: '/track_stats/{task}/{from}/{to}',
    handler: function(request, reply) {
      var table = request.params.task.simplify();
      get.track_stats(client, request, reply, table);
    }
  }, {
    method: 'POST',
    path: '/task/{task}',
    handler: function(request, reply) {
      var table = tasks[request.params.task.simplify()];
      post.task(client, request, reply, lockPeriod, table);
    }
  }, {
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
  }, {
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
  }, {
    method: 'GET',
    path: '/detail/{idtask}',
    handler: function(request, reply) {
      get.detail(client, request, reply);
    }
  }, {
    method: 'POST',
    path: '/csv',
    config: {
      payload: {
        maxBytes: 300000000,
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
  }];

  function load_tasks(status) {
    if (status) {
      tasks = {};
      var query = 'SELECT id, tasktable FROM task_details ORDER BY status, title;';
      var cliente = client.query(query, function(err, results) {
        if (err || !results) return false;
        results.rows.forEach(function(row) {
          tasks[row.id] = row.tasktable;
        });
      });
    }
  }
};
String.prototype.simplify = function() {
  return this.replace(/[^a-zA-Z]+/g, '').toLowerCase();
};
module.exports = routes;
