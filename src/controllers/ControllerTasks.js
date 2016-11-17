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

var folder = os.tmpDir();
var client;
if (process.env.NODE_ENV === 'production') {
  var creds = new AWS.ECSCredentials();
  creds.get();
  creds.refresh(function(err) {
    if (err) throw err;
    var amazonES = {
      region: config.region,
      credentials: creds
    };
    client = new elasticsearch.Client({
      host: process.env.ElasticHost,
      connectionClass: AwsEsConnector,
      amazonES: amazonES
    });
  });
} else {
  client = localClient.connect();
}

module.exports.listTasks = function(request, reply) {
  client.search({
    index: 'tofix',
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
      tasks: tasks
    });
  });
};

module.exports.listTasksById = function(request, reply) {
  var idtask = request.params.idtask;
  client.get({
    index: 'tofix',
    type: 'tasks',
    id: idtask
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    reply(resp._source);
  });
};

module.exports.createTasks = function(request, reply) {
  var data = request.payload;
  if (data.password === config.password) {
    var task = {
      idtask: data.name.concat(randomString({
        length: 5
      })).replace(/[^a-zA-Z]+/g, '').toLowerCase(),
      isCompleted: false,
      isAllItemsLoad: false,
      value: {
        name: data.name,
        description: data.description,
        updated: Math.round((new Date()).getTime() / 1000),
        changesetComment: data.changesetComment,
        stats: [{
          edit: 0,
          fixed: 0,
          noterror: 0,
          skip: 0
        }]
      }
    };
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
              index: 'tofix'
            }, function(err) {
              if (err) return reply(boom.badRequest(err));
              cb();
            });
          } else {
            cb();
          }

        });

        q.defer(function(cb) {
          //set all features in a array to insert massive features  on my type
          var rd = readline.createInterface({
            input: fs.createReadStream(path.join(folder, task.idtask)),
            output: process.stdout,
            terminal: false
          });
          rd.on('line', function(line) {
            var obj = JSON.parse(line);
            bulk.push({
                index: {
                  _index: 'tofix',
                  _type: task.idtask,
                  _id: obj.properties._key
                }
              },
              obj
            );
          }).on('close', function() {
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
              index: 'tofix',
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
                    index: 'tofix',
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
          //no waste time on waiting to upload all data to elasticSearch
          cb();
        });
        q.defer(function(cb) {
          // save the task on document
          client.create({
            index: 'tofix',
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
  } else {
    return reply(boom.badRequest('password does not match'));
  }
};

module.exports.updateTasks = function(request, reply) {
  var data = request.payload;
  var idtask = data.idtask;
  if (data.password === config.password) {
    client.get({
      index: 'tofix',
      type: 'tasks',
      id: idtask
    }, function(err, resp) {
      if (err) return reply(boom.badRequest(err));
      var result = resp._source;
      var task = {
        idtask: idtask,
        isCompleted: data.isCompleted !== 'false',
        value: {
          name: data.name,
          description: data.description,
          updated: Math.round((new Date()).getTime() / 1000),
          changesetComment: data.changesetComment,
          stats: result.value.stats
        }
      };
      var bulk = [];
      var bulkToRemove = [];

      if (data.file) {
        task.value.stats.push({
          edit: 0,
          fixed: 0,
          noterror: 0,
          skip: 0
        });
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
                index: 'tofix',
                type: idtask,
                scroll: '15s'
              }, function getMore(err, resp) {
                if (err) return reply(boom.badRequest(err));
                resp.hits.hits.forEach(function(v) {
                  bulkToRemove.push({
                    delete: {
                      _index: 'tofix',
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
              client.bulk({
                index: 'tofix',
                id: task.idtask,
                type: task.idtask,
                body: bulkToRemove
              }, function(err) {
                if (err) return reply(boom.badRequest(err));
                cb();
              });
            });

            q.defer(function(cb) {
              //set all features in a array to insert massive features  on my type
              var rd = readline.createInterface({
                input: fs.createReadStream(path.join(folder, task.idtask)),
                output: process.stdout,
                terminal: false
              });
              rd.on('line', function(line) {
                var obj = JSON.parse(line);
                bulk.push({
                    index: {
                      _index: 'tofix',
                      _type: task.idtask,
                      _id: obj.properties._key
                    }
                  },
                  obj
                );
              }).on('close', function() {
                cb();
              });
            });

            q.defer(function(cb) {
              // update data on type
              var bulkChunks = _.chunk(bulk, config.arrayChunks);
              var counter = 0;
              var errorsCounter = 0;

              function saveData(bulkChunk) {
                client.bulk({
                  maxRetries: 5,
                  index: 'tofix',
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
              saveData(bulkChunks[0]);
            });

            q.defer(function(cb) {
              // update the task
              client.update({
                index: 'tofix',
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
          index: 'tofix',
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
  } else {
    return reply(boom.badRequest('password does not match'));
  }
};

module.exports.deleteTasks = function(request, reply) {
  var data = request.payload;
  var idtask = data.idtask;
  if (data.password === config.password) {
    client.delete({
      index: 'tofix',
      type: 'tasks',
      id: idtask
    }, function(err, resp) {
      if (err) return reply(boom.badRequest(err));
      reply(resp);
    });
  } else {
    return reply(boom.badRequest(config.messages.wrongPassword));
  }
};

function indexExists() {
  return client.indices.exists({
    index: 'tofix'
  });
}
