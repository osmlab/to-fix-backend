'use strict';
var boom = require('boom');
var fs = require('fs');
var os = require('os');
var path = require('path');
var _ = require('lodash');
var geojsonhint = require('geojsonhint');
var randomString = require('random-string');
var d3 = require('d3-queue');
var readline = require('readline');
var AWS = require('aws-sdk');
var elasticsearch = require('elasticsearch');
var AwsEsConnector = require('http-aws-es');
var config = require('./../configs/config');
var format = require('./../utils/formatGeojson');
var localClient = require('./../utils/connection');

module.exports = {
  indexExists,
  taskObjects
};

var folder = os.tmpDir();
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
  var bulk = [];
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
        //format geojson file
        format.formatGeojson(geojsonFile, task, function(currentTask) {
          task = currentTask;
          cb();
        });
      });

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
        loadItems(task, function(err, data) {
          if (err) cb(err);
          bulk = data;
          cb();
        });
      });

      q.defer(function(cb) {
        // save data on type
        var bulkChunks = _.chunk(bulk, config.arrayChunks);
        var counter = 0;
        var errorsCounter = 0;

        function saveData(bulkChunk) {
          client.bulk({
            maxRetries: 5,
            index: config.index,
            id: task.idtask,
            type: task.idtask,
            body: bulkChunk
          }, function(err) {

            if (err) {
              //try 3 times to save the chunk
              errorsCounter++;
              if (errorsCounter === 3) {
                return reply(boom.badRequest(err));
              } else {
                saveData(bulkChunks[counter]);
              }
            } else {
              counter++;
              if (bulkChunks.length > counter) {
                saveData(bulkChunks[counter]);
              } else {
                //Update isAllItemsLoad=true when all items were uploaded in elasticsearch
                client.update({
                  index: config.index,
                  type: 'tasks',
                  id: task.idtask,
                  body: {
                    doc: {
                      isAllItemsLoad: true
                    }
                  }
                }, function(err) {
                  if (err) console.log(err);
                });
              }
            }
          });
        }
        saveData(bulkChunks[0]);
        //no waste time waiting to upload all data to elasticSearch
        cb();
      });
      q.defer(function(cb) {
        // save the task in document
        client.create({
          index: config.index,
          id: task.idtask,
          type: 'tasks',
          body: task
        }, function(err) {
          if (err) return reply(boom.badRequest(err));
          cb();
        });
      });
      q.await(function(error) {
        if (error) throw error;
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
    console.log(task);
    var bulk = [];
    var bulkToRemove = [];
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
            //format geojson file
            format.formatGeojson(geojsonFile, task, function(currentTask) {
              task = currentTask;
              cb();
            });
          });
          q.defer(function(cb) {
            var numItems = 0;
            client.search({
              index: config.index,
              type: idtask,
              scroll: '15s'
            }, function getMore(err, resp) {
              if (err) return reply(boom.badRequest(err));
              resp.hits.hits.forEach(function(v) {
                bulkToRemove.push({
                  delete: {
                    _index: config.index,
                    _type: idtask,
                    _id: v._id
                  }
                });
                numItems++;
              });
              if (resp.hits.total !== numItems) {
                client.scroll({
                  scrollId: resp._scroll_id,
                  scroll: '15s'
                }, getMore);
              } else {
                cb();
              }
            });
          });

          q.defer(function(cb) {
            //remove items
            if (bulkToRemove.length > 0) {
              client.bulk({
                index: config.index,
                id: task.idtask,
                type: task.idtask,
                body: bulkToRemove
              }, function(err) {
                if (err) return reply(boom.badRequest(err));
                cb();
              });
            } else {
              cb();
            }
          });

          q.defer(function(cb) {
            loadItems(task, function(err, data) {
              if (err) cb(err);
              bulk = data;
              cb();
            });
          });

          q.defer(function(cb) {
            // update data on type
            var bulkChunks = _.chunk(bulk, config.arrayChunks);
            var counter = 0;
            var errorsCounter = 0;
            if (bulk.length > 0) {
              saveData(bulkChunks[0]);
            } else {
              task.isCompleted = true;
              task.isAllItemsLoad = true;
              task.value.stats[task.value.stats.length - 1].items = 0;
              cb();
            }

            function saveData(bulkChunk) {
              client.bulk({
                maxRetries: 5,
                index: config.index,
                id: task.idtask,
                type: task.idtask,
                body: bulkChunk
              }, function(err) {
                if (err) {
                  //try 3 times to save the chunk
                  errorsCounter++;
                  if (errorsCounter === 3) {
                    return reply(boom.badRequest(err));
                  } else {
                    saveData(bulkChunks[counter]);
                  }
                } else {
                  counter++;
                  if (bulkChunks.length > counter) {
                    saveData(bulkChunks[counter]);
                  } else {
                    cb();
                  }
                }
              });
            }
          });

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
  var idtask = data.name.concat(randomString({
    length: 5
  })).replace(/[^a-zA-Z]+/g, '').toLowerCase();
  var status = {
    edit: 0,
    fixed: 0,
    noterror: 0,
    skip: 0
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
    if (data.idtask && data.file) {
      stats.push(status);
    }
    iduser = result.iduser;
  }
  return {
    idtask: idtask,
    isCompleted: isCompleted,
    isAllItemsLoad: false,
    iduser: iduser,
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

function loadItems(task, done) {
  //set all features in a array to insert massive features  on my type
  var bulk = [];
  var rd = readline.createInterface({
    input: fs.createReadStream(path.join(folder, task.idtask)),
    output: process.stdout,
    terminal: false
  });
  rd.on('line', function(line) {
    var obj = JSON.parse(line);
    var index = {
      index: {
        _index: config.index,
        _type: task.idtask,
        _id: obj.properties._key
      }
    };
    bulk.push(index, obj);
  }).on('close', function() {
    done(null, bulk);
  }).on('error', function(e) {
    done(e, null);
  });
}
