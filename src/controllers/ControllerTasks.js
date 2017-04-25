'use strict';
var boom = require('boom');
var fs = require('fs');
var os = require('os');
var path = require('path');
var geojsonhint = require('geojsonhint');
var d3 = require('d3-queue');
var exec = require('executive');

var AWS = require('aws-sdk');
var elasticsearch = require('elasticsearch');
var AwsEsConnector = require('http-aws-es');
var config = require('./../configs/config');
var localClient = require('./../utils/connection');

module.exports = {
  indexExists,
  taskObjects
};

var folder = os.tmpdir();
var client;
if (config.envType) {
  var creds = new AWS.ECSCredentials();
  creds.get();
  creds.refresh(function(err) {
    if (err) throw err;
    var amazonES = {
      region: config.region,
      credentials: creds
    };
    client = new elasticsearch.Client({
      host: config.ElasticHost,
      connectionClass: AwsEsConnector,
      amazonES: amazonES
    });
  });
} else {
  client = localClient.connect();
}

/* eslint-disable camelcase */
module.exports.listTasks = function(request, reply) {
  client.search({
    index: config.index,
    type: 'tasks',
    body: {
      size: 500,
      query: {
        match_all: {}
      }
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    var tasks = resp.hits.hits.map(function(v) {
      v._source.value.stats = v._source.value.stats[v._source.value.stats.length - 1];
      return v._source;
    });
    reply({
      tasks: tasks.sortBy()
    });
  });
};
/* eslint-enable camelcase */

module.exports.listTasksById = function(request, reply) {
  var idtask = request.params.idtask;
  client.get({
    index: config.index,
    type: 'tasks',
    id: idtask
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    reply(resp._source);
  });
};

module.exports.createTasks = function(request, reply) {
  var data = request.payload;
  var iduser = request.auth.credentials.id;
  var task = taskObjects(data, iduser, null);
  var name = data.file.hapi.filename;
  var geojsonFile = path.join(folder, name);
  var file = fs.createWriteStream(geojsonFile);
  file.on('error', function(err) {
    if (err) return reply(boom.badRequest(err));
  });
  data.file.pipe(file);
  data.file.on('end', function(err) {
    if (err) return reply(boom.badRequest(err));
    if (geojsonhint.hint(file) && path.extname(geojsonFile) === '.geojson') { //check  more detail the data
      var q = d3.queue(1);

      q.defer(function(cb) {
        if (!indexExists()) {
          client.indices.create({
            index: config.index
          }, function(err) {
            if (err) return reply(boom.badRequest(err));
            cb();
          });
        } else {
          cb();
        }
      });

      q.defer(function(cb) {
        // save the task in document
        client.create({
          index: config.index,
          id: task.idtask,
          type: 'tasks',
          body: task
        }, function(err) {
          if (err) {
            cb(err);
          } else {
            cb();
          }
        });
      });

      q.defer(function(cb) {
        var command = ['node',
          'src/utils/import/index.js',
          '--task',
          '\'' + JSON.stringify(task) + '\'',
          '--file',
          geojsonFile
        ];
        console.log(command.join(' '));
        exec(command.join(' '));
        cb();
      });

      q.await(function(error) {
        if (error) return reply(boom.badRequest(err));
        reply(task);
      });
    } else {
      reply(boom.badData(config.messages.badData));
    }
  });
};

module.exports.updateTasks = function(request, reply) {
  var data = request.payload;
  var idtask = data.idtask;
  var iduser = request.auth.credentials.id;
  client.get({
    index: config.index,
    type: 'tasks',
    id: idtask
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    var result = resp._source;
    var task = taskObjects(data, iduser, result);
    if (data.file) {
      var name = data.file.hapi.filename;
      var geojsonFile = path.join(folder, name);
      var file = fs.createWriteStream(geojsonFile);
      file.on('error', function(err) {
        if (err) return reply(boom.badRequest(err));
      });
      data.file.pipe(file);
      data.file.on('end', function(err) {
        if (err) return reply(boom.badRequest(err));
        if (geojsonhint.hint(file) && path.extname(geojsonFile) === '.geojson') {
          var q = d3.queue(1);

          q.defer(function(cb) {
            // update the task
            client.update({
              index: config.index,
              type: 'tasks',
              id: task.idtask,
              body: {
                doc: task
              }
            }, function(err) {
              if (err) return reply(boom.badRequest(err));
              cb();
            });
          });

          q.defer(function(cb) {
            var command = ['node',
              'src/utils/import/index.js',
              '--task',
              '\'' + JSON.stringify(task) + '\'',
              '--file',
              geojsonFile
            ];
            console.log(command.join(' '));
            exec(command.join(' '));
            cb();
          });

          q.await(function(error) {
            if (error) return reply(boom.badRequest(err));
            reply(task);
          });
        }
      });
    } else {
      client.update({
        index: config.index,
        type: 'tasks',
        id: task.idtask,
        body: {
          doc: task
        }
      }, function(err) {
        if (err) return reply(boom.badRequest(err));
        reply(task);
      });
    }
  });
};

module.exports.deleteTasks = function(request, reply) {
  var idtask = request.payload.idtask;
  client.delete({
    index: config.index,
    type: 'tasks',
    id: idtask
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    reply(resp);
  });
};

module.exports.verifyRole = function(request, reply) {
  var data = request.payload;
  var idtask = data.idtask;
  var iduser = request.auth.credentials.id;
  var role = request.auth.credentials.role;
  if (role === 'superadmin' || role === 'machine') {
    reply(request);
  } else {
    client.get({
      index: config.index,
      type: 'tasks',
      id: idtask
    }, function(err, resp) {
      if (err) return reply(boom.badRequest(err));
      var task = resp._source;
      if (task.iduser === iduser && role === 'admin') {
        reply(request);
      } else {
        reply(boom.forbidden('Insufficient scope'));
      }
    });
  }
};

/**
 * Check if index exist or not
 * @return {boolean} true, when the index exist
 */
function indexExists() {
  return client.indices.exists({
    index: config.index
  });
}

/**
 * Create or update task object
 * @param  {object} payload data
 * @param  {object} or {null} null to create a task and object to updat a task
 * @return {object} object task
 */
function taskObjects(data, iduser, result) {
  var idtask = data.name.replace(/[^a-zA-Z]+/g, '').toLowerCase();
  var status = {
    edit: 0,
    fixed: 0,
    noterror: 0,
    skip: 0,
    type: 'v1',
    items: 0,
    date: Math.round((new Date()).getTime() / 1000)
  };
  var stats = [status];
  var isCompleted = false;
  //to update a task
  if (data.idtask) {
    idtask = data.idtask;
    isCompleted = data.isCompleted !== 'false';
  }
  if (result) {
    stats = result.value.stats;
    var version = parseInt(stats[stats.length - 1].type.replace(/^\D+/g, '')) + 1;
    if (data.idtask && data.file) {
      status.type = 'v' + version;
      stats = [status];
    }
    iduser = result.iduser;
  }
  return {
    idtask: idtask,
    isCompleted: isCompleted,
    isAllItemsLoad: false,
    iduser: iduser,
    status: true,
    value: {
      name: data.name,
      description: data.description,
      updated: Math.round((new Date()).getTime() / 1000),
      changesetComment: data.changesetComment,
      stats: stats
    }
  };
}

/*eslint no-extend-native: ["error", { "exceptions": ["Array"] }]*/
Array.prototype.sortBy = function() {
  return this.slice(0).sort(function(a, b) {
    return (a.value.updated > b.value.updated) ? 1 : (a.value.updated < b.value.updated) ? -1 : 0;
  });
};
