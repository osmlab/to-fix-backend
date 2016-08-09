'use strict';
var boom = require('boom');
var fs = require('fs');
var os = require('os');
var path = require('path');
var _ = require('underscore');
var geojsonhint = require('geojsonhint');
var randomString = require('random-string');
var d3 = require('d3-queue');
var config = require('./../configs/config');
var queries = require('./../queries/queries');
var format = require('./../utils/formatGeojson');
var loadGeojsonToDB = require('./../utils/loadGeojsonToDB');
var saveGeojsonFromDB = require('./../utils/saveGeojsonFromDB');
var folder = os.tmpDir();

module.exports.listTasks = function(request, reply) {
  var client = request.pg.client;
  client.query(queries.selectTasks(), function(err, result) {
    if (err) return reply(boom.badRequest(err));
    var tasks = result.rows.map(function(val) {
      var task = _.values(val)[0];
      task.value.stats = [task.value.stats[task.value.stats.length - 1]];
      return task;
    });
    return reply({
      tasks: tasks
    });
  });
};

module.exports.listTasksById = function(request, reply) {
  var client = request.pg.client;
  var idtask = request.params.idtask;
  client.query(queries.selectTasksById(), [idtask], function(err, result) {
    if (err) return reply(boom.badRequest(err));
    return reply(result.rows[0]);
  });
};

module.exports.createTasks = function(request, reply) {
  var data = request.payload;
  var client = request.pg.client;
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
          // create temp table
          client.query(queries.createTempTable(task.idtask), function(err, result) {
            if (err) cb(err);
            cb();
          });
        });
        q.defer(function(cb) {
          //upload geojson dat to DB
          loadGeojsonToDB.uploadtoDB(request, task, function(err, currentTask) {
            if (err) {
              cb(err);
            } else {
              cb();
            }
          });
        });
        q.defer(function(cb) {
          //create table and table stats
          client.query(queries.createTables(task.idtask), function(err, result) {
            if (err) cb(err);
            cb();
          });

        });
        q.defer(function(cb) {
          //copy from tmp_table to table
          client.query(queries.copyFromTmptoTable(task.idtask), function(err, result) {
            if (err) cb(err);
            cb();
          });
        });
        q.defer(function(cb) {
          //save the task
          client.query(queries.saveATask(), [task.idtask, true, JSON.stringify(task)], function(err, result) {
            if (err) {
              console.log(err);
              cb(err);
            } else {
              console.log(`save ${task.idtask} ok`);
              cb();
            }
          });
        });
        q.defer(function(cb) {
          //delete tmp table
          var client = request.pg.client;
          client.query(queries.dropTempTable(task.idtask), function(err, result) {
            if (err) {
              cb(err);
            } else {
              cb();
            }
          });
        });
        q.await(function(error) {
          if (error) throw error;
          reply(task);
        });
      } else {
        reply(boom.badData('The data is bad and you should fix it'));
      }
    });
  } else {
    return reply(boom.badRequest('password does not match'));
  }
};

module.exports.updateTasks = function(request, reply) {
  var data = request.payload;
  var idtask = data.idtask;
  var client = request.pg.client;
  if (data.password === config.password) {
    client.query(queries.selectTasksById(), [idtask], function(err, result) {
      if (err) return reply(boom.badRequest(err));
      result = result.rows[0].value;
      if (result) {
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
                // create temp table
                client.query(queries.createTempTable(idtask), function(err, result) {
                  if (err) cb(err);
                  cb();
                });
              });
              q.defer(function(cb) {
                //upload geojson to DB
                loadGeojsonToDB.uploadtoDB(request, task, function(err, currentTask) {
                  if (err) cb(err);
                  cb();
                });
              });
              q.defer(function(cb) {
                // Backup of previous items
                var backupFile = path.join(folder, task.idtask + '-' + (task.value.stats.length - 1) + '.backup');
                task.value.stats[task.value.stats.length - 2].backupFile = backupFile;
                saveGeojsonFromDB.saveBackup(task, function(err, currentTask) {
                  if (err) cb(err);
                  cb();
                });
              });
              q.defer(function(cb) {
                //remove all previous items rows on table
                client.query(queries.deleteRowsTable(task.idtask), function(err, result) {
                  if (err) cb(err);
                  cb();
                });
              });
              q.defer(function(cb) {
                //copy from tmp_table to table
                setTimeout(function() {
                  client.query(queries.copyFromTmptoTable(idtask), function(err, result) {
                    if (err) cb(err);
                    cb();
                  });
                }, 500);
              });
              q.defer(function(cb) {
                //delete tmp table
                var client = request.pg.client;
                client.query(queries.dropTempTable(task.idtask), function(err, result) {
                  if (err) cb(err);
                  cb();
                });
              });
              q.defer(function(cb) {
                //update task
                client.query(queries.updateATask(), [JSON.stringify(task), idtask], function(err, result) {
                  if (err) cb(err);
                  cb();
                });
              });
              q.await(function(error) {
                if (error) return reply(err);
                reply(task);
              });
            }
          });
        } else {
          client.query(queries.updateATask(), [JSON.stringify(task), idtask], function(err, result) {
            if (err) return reply(err);
            return reply(task);
          });
        }
      } else {
        //no find task
        return reply({
          sattus: 'no find the ' + idtask + ' task'
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
  var client = request.pg.client;
  if (data.password === config.password) {
    client.query(queries.deleteTasksById(), [false, idtask], function(err, result) {
      if (err) {
        return reply(boom.badRequest(err));
      } else {
        client.query(queries.dropTableTask(idtask), function(err, result) {
          if (err) return reply(boom.badRequest(err));
          return reply({
            task: idtask,
            message: 'task was deleted'
          });
        });
      }
    });
  } else {
    return reply(boom.badRequest('password does not match'));
  }
};

module.exports.listTasksActivity = function(request, reply) {
  var client = request.pg.client;
  var idtask = request.params.idtask;
  var from = Math.round(+new Date(request.params.from.split(':')[1]) / 1000);
  var to = Math.round(+new Date(request.params.to.split(':')[1]) / 1000) + 24 * 60 * 60;
  if (from === to) to = to + 86400;
  client.query(queries.selectActivity(idtask), [to, from], function(err, result) {
    if (err) return reply(boom.badRequest(err));
    return reply({
      updated: Math.round((new Date()).getTime() / 1000),
      data: result.rows
    });
  });
};
module.exports.listTasksActivityByUser = function(request, reply) {
  var client = request.pg.client;
  var idtask = request.params.idtask;
  var user = request.params.user;
  var from = Math.round(+new Date(request.params.from.split(':')[1]) / 1000);
  var to = Math.round(+new Date(request.params.to.split(':')[1]) / 1000) + 24 * 60 * 60;
  if (from === to) to = to + 86400;
  client.query(queries.selectActivityByUser(idtask), [to, from, user], function(err, result) {
    if (err) return reply(boom.badRequest(err));
    return reply({
      updated: Math.round((new Date()).getTime() / 1000),
      user: user,
      data: result.rows
    });
  });
};
module.exports.trackStats = function(request, reply) {
  var client = request.pg.client;
  var idtask = request.params.idtask;
  var from = Math.round(+new Date(request.params.from.split(':')[1]) / 1000);
  var to = Math.round(+new Date(request.params.to.split(':')[1]) / 1000) + 24 * 60 * 60;
  if (from === to) to = to + 86400;
  client.query(queries.selectTrackStats(idtask), [to, from], function(err, result) {
    if (err) return reply(boom.badRequest(err));
    var data = {};
    result.rows.forEach(function(v) {
      if (!data[v.value.user]) {
        data[v.value.user] = {
          edit: 0,
          fixed: 0,
          noterror: 0,
          skip: 0,
          user: v.value.user
        };
        data[v.value.user][v.value.action] = data[v.value.user][v.value.action] + 1;
      } else {
        data[v.value.user][v.value.action] = data[v.value.user][v.value.action] + 1;
      }
    });
    reply({
      updated: Math.round((new Date()).getTime() / 1000),
      stats: _.values(data)
    });
  });
};
