var fs = require('fs'),
    hapi = require('hapi'),
    pg = require('pg'),
    boom = require('boom'),
    pg_copy = require('pg-copy-streams'),
    hstore = require('pg-hstore')(),
    queue = require('queue-async'),
    reformatCsv = require('./lib/reformat-csv'),
    queries = require('./lib/queries');

var get_functions = require('./lib/get_functions');
var post_functions = require('./lib/post_functions');

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
                reply(boom.badRequest(err));
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
    method: 'POST',
    path: '/track/{task}',
    handler: function(request, reply) {
        var table = request.params.task.simplify();
        var attributes = request.payload.attributes;
        if (!attributes) return reply(boom.badRequest('missing attributes'));
        // don't wait
        reply();
        post_functions.track(client, table, request.payload.time, attributes, function(err, results) {
            if (err) console.error('/track err', err);
        });
    }
});


server.route({
    method: 'GET',
    path: '/count/{task}',
    handler: function(request, reply) {
        var table = tasks[request.params.task.simplify()];
        get_functions.count(client, request, reply, table);
    }
});

server.route({
    method: 'GET',
    path: '/count_history/{task}/{grouping}',
    handler: function(request, reply) {
        var table = request.params.task.simplify();
        get_functions.count_history(client, request, reply,table);
    }
});

server.route({
    method: 'GET',
    path: '/track/{task}/{key}:{value}/{to?}',
    handler: function(request, reply) {
        var table = request.params.task.simplify();
        get_functions.track(client, request, reply,table);
    }
});

server.route({
    method: 'GET',
    path: '/track_stats/{task}/{from}/{to}',
    handler: function(request, reply) {
        var table = request.params.task.simplify();
        get_functions.track_stats(client, request, reply,table);
    }
});

server.route({
    method: 'POST',
    path: '/task/{task}',
    handler: function(request, reply) {
        var table = tasks[request.params.task.simplify()];
        post_functions.task(client, request, reply, lockPeriod, table);
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
        post_functions.fixed(client, request, reply, table);
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
        post_functions.noterror(client, request, reply, table);
    }
});

server.route({
    method: 'GET',
    path: '/detail/{idtask}',
    handler: function(request, reply) {
        get_functions.detail(client, request, reply);
    }
});

server.route({
    method: 'GET',
    path: '/tasks',
    handler: function(request, reply) {
        get_functions.tasks(client, request, reply);
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
        post_functions.csv(client, request, reply, function(results) {
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
        // cliente.on('end', function(result) {
        //     console.log(tasks);
        // });
    }
}

String.prototype.simplify = function() {
    return this.replace(/[^a-zA-Z]+/g, '').toLowerCase()
};

pg.connect(conString, function(err, c, d) {
    if (err) return console.log(err);
    console.log('connected to:', address);
    client = c;
    done = d;
    server.start(function() {
        console.log('server on port', port);
        load_tasks(true)
    });
});