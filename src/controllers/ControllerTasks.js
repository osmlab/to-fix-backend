'use strict';
var boom = require('boom');
var fs = require('fs');
var os = require('os');
var path = require('path');
var _ = require('underscore');
var geojsonhint = require('geojsonhint');
var randomString = require('random-string');
var d3 = require('d3-queue');
var readline = require('readline');
var config = require('./../configs/config');
var format = require('./../utils/formatGeojson');
var client = require('./../utils/connection.js');
var folder = os.tmpDir();

module.exports.listTasks = function(request, reply) {
  client.search({
    index: 'tofix',
    type: 'tasks',
    body: {
      query: {
        match_all: {}
      }
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    var tasks = resp.hits.hits.map(function(v) {
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
      status: true,
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
              index: 'tofix' //=database
            }, function(err, resp) {
              if (err) return reply(boom.badRequest(err));
              // console.log('create index', resp);
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
          client.bulk({
            maxRetries: 5,
            index: 'tofix',
            id: task.idtask,
            type: task.idtask,
            body: bulk
          }, function(err, resp) {
            if (err) {
              console.log(err);
            } else {
              console.log(resp.items);
              cb();
            }
          });
        });

        // need to remove this option, check out later
        q.defer(function(cb) {
          // create stats document for each task
          client.create({
            index: 'tofix',
            //id: task.idtask + '_stats'
            type: task.idtask + '_stats'
          }, function(err, resp) {
            // if (err) return reply(boom.badRequest(err));
            cb();
          });
        });

        q.defer(function(cb) {
          // save the task on document
          client.create({
            index: 'tofix',
            id: task.idtask,
            type: 'tasks',
            body: task
          }, function(err, resp) {
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
        status: result.status,
        value: {
          name: data.name,
          description: data.description,
          updated: Math.round((new Date()).getTime() / 1000),
          changesetComment: data.changesetComment,
          stats: result.value.stats,
          status: data.status
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
          console.error(err);
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
              //Load Items to remove.
              client.count({
                index: 'tofix',
                type: task.idtask
              }, function(err, res) {
                if (err) return reply(boom.badRequest(err));
                client.search({
                  index: 'tofix',
                  type: idtask,
                  body: {
                    size: res.count,
                    query: {
                      match_all: {}
                    }
                  }
                }, function(err, resp) {
                  if (err) return reply(boom.badRequest(err));
                  resp.hits.hits.forEach(function(v) {
                    //add here create the backup
                    bulkToRemove.push({
                      delete: {
                        _index: 'tofix',
                        _type: task.idtask,
                        _id: v._id
                      }
                    });
                  });
                  cb();
                });
              });
            });

            q.defer(function(cb) {
              //remove items
              client.bulk({
                index: 'tofix',
                id: task.idtask,
                type: task.idtask,
                body: bulkToRemove
              }, function(err, resp) {
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
              client.bulk({
                maxRetries: 5,
                index: 'tofix',
                id: task.idtask,
                type: task.idtask,
                body: bulk
              }, function(err, resp) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(resp.items);
                  cb();
                }
              });
            });

            q.defer(function(cb) {
              // update the task
              client.update({
                index: 'tofix',
                type: 'tasks',
                id: task.idtask,
                body: {
                  doc: {
                    value: task.value
                  }
                }
              }, function(err, resp) {
                if (err) console.log(err);
                cb();
              });
            });

            q.await(function(error) {
              if (error) return reply(err);
              console.log(JSON.stringify(task));
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
            doc: {
              value: task.value
            }
          }
        }, function(err, resp) {
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

module.exports.listTasksActivity = function(request, reply) {
  var idtask = request.params.idtask;
  var from = Math.round(+new Date(request.params.from.split(':')[1]) / 1000);
  var to = Math.round(+new Date(request.params.to.split(':')[1]) / 1000) + 24 * 60 * 60;
  if (from === to) to = to + 86400;
  client.search({
    index: 'tofix',
    type: idtask + '_stats',
    body: {
      sort: {
        'time': {
          order: 'desc'
        }
      },
      query: {
        bool: {
          must: [{
            range: {
              time: {
                gte: from,
                lte: to
              }
            }
          }]
        }
      }
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    var activity = resp.hits.hits.map(function(v) {
      return v._source;
    });
    return reply({
      updated: Math.round((new Date()).getTime() / 1000),
      data: activity
    });
  });
};

module.exports.listTasksActivityByUser = function(request, reply) {
  var idtask = request.params.idtask;
  var user = request.params.user;
  var from = Math.round(+new Date(request.params.from.split(':')[1]) / 1000);
  var to = Math.round(+new Date(request.params.to.split(':')[1]) / 1000) + 24 * 60 * 60;
  if (from === to) to = to + 86400;
  client.search({
    index: 'tofix',
    type: idtask + '_stats',
    body: {
      sort: {
        'time': {
          order: 'desc'
        }
      },
      query: {
        bool: {
          must: [{
            range: {
              time: {
                gte: from,
                lte: to
              }
            }
          }]
        }
      },
      filter: {
        term: {
          user: user
        }
      }
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    var activity = resp.hits.hits.map(function(v) {
      return v._source;
    });
    return reply({
      updated: Math.round((new Date()).getTime() / 1000),
      data: activity
    });
  });
};

module.exports.trackStats = function(request, reply) {
  var idtask = request.params.idtask;
  var from = Math.round(+new Date(request.params.from.split(':')[1]) / 1000);
  var to = Math.round(+new Date(request.params.to.split(':')[1]) / 1000) + 24 * 60 * 60;
  if (from === to) to = to + 86400;
  client.search({
    index: 'tofix',
    type: idtask + '_stats',
    body: {
      sort: {
        'time': {
          order: 'desc'
        }
      },
      query: {
        bool: {
          must: [{
            range: {
              time: {
                gte: from,
                lte: to
              }
            }
          }]
        }
      }
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    var activity = resp.hits.hits;
    var data = {};
    activity.forEach(function(v) {
      v = v._source;
      if (!data[v.user]) {
        data[v.user] = {
          edit: 0,
          fixed: 0,
          noterror: 0,
          skip: 0,
          user: v.user
        };
        data[v.user][v.action] = data[v.user][v.action] + 1;
      } else {
        data[v.user][v.action] = data[v.user][v.action] + 1;
      }
    });

    reply({
      updated: Math.round((new Date()).getTime() / 1000),
      stats: _.values(data)
    });
  });
};

function indexExists() {
  return client.indices.exists({
    index: 'tofix'
  });
}