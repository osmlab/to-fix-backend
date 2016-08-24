'use strict';
var massive = require('massive');
var boom = require('boom');
var fs = require('fs');
var os = require('os');
var path = require('path');
var _ = require('underscore');
var geojsonhint = require('geojsonhint');
var childProcess = require('child_process');
var randomString = require('random-string');
var util = require('./../utils/util');
var config = require('./../configs/config');
var queries = require('./../queries/queries');
var folder = os.tmpDir();

var db = massive.connectSync({
  connectionString: config.connectionString
});
module.exports.listTasks = function(request, reply) {
  db.tasks.find({
    status: true
  }, function(err, tasks) {
    if (err) return reply(boom.badRequest(err));
    return reply(tasks);
  });
};
module.exports.listTasksById = function(request, reply) {
  db.tasks.find({
    idstr: request.params.idtask
  }, function(err, tasks) {
    if (err) return reply(boom.badRequest(err));
    return reply(tasks[0]);
  });
};
module.exports.createTasks = function(request, reply) {
  var data = request.payload;
  if (data.file) {
    var task = {
      idstr: data.name.concat(randomString({
        length: 5
      })).replace(/[^a-zA-Z]+/g, '').toLowerCase(),
      idproject: data.idproject,
      status: true,
      body: {
        name: data.name,
        description: data.description,
        updated: Math.round((new Date()).getTime() / 1000),
        changesetComment: data.changesetComment,
        loadStatus: 'loading',
        entitiesToFix: data.entitiesToFix,
        detailedInstructions: data.detailedInstructions,
        priority: data.priority,
        status: data.status,
        imagery: data.imagery,
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
        util.createTable(request, task.idstr, function(err, result) {
          if (err) {
            console.log(err);
          } else {
            console.log(`Table ok :${result}`);
            util.createTableStats(request, task.idstr, function(err, result) {
              if (err) {
                console.log(err);
              } else {
                console.log(`Table Stats ok :${result}`);
                //save task
                db.tasks.save(task, function(err, result) {
                  if (err) return reply(boom.badRequest(err));
                  reply(result);
                  db.loadTables(function(err, db) {
                    if (err) return reply(boom.badRequest(err));
                    console.log('reload tables');
                  });
                  //insert data into DB
                  var child = childProcess.fork('./src/utils/loadGeojsonToDB');
                  child.send({
                    file: geojsonFile,
                    task: result
                  });
                  child.on('message', function(props) {
                    if (props.result) {
                      //update when the load is complete
                      props.result.task.body.loadStatus = 'complete';
                      db.tasks.update({
                        id: props.result.task.id
                      }, {
                        body: props.result.task.body
                      }, function(err, res) {
                        if (err) return reply(boom.badRequest(err));
                        console.log('load completed');
                      });

                    } else {
                      //error saving the data
                      result.task.body.loadStatus = 'error';
                      db.tasks.update({
                        id: result.task.id
                      }, {
                        body: result.task.body
                      }, function(err, res) {
                        if (err) return reply(boom.badRequest(err));
                        console.log('Error loading te data');
                      });
                    }
                  });
                });
              }
            });
          }
        });
      } else {
        reply(boom.badData('The data is bad and you should fix it'));
      }
    });
  }
};
module.exports.updateTasks = function(request, reply) {
  var data = request.payload;
  var idtask = request.params.idtask;
  db.tasks.find(data.id, function(err, result) {
    if (err) return reply(boom.badRequest(err));
    var task = {
      id: data.id,
      idstr: idtask,
      idproject: data.idproject,
      status: true,
      body: {
        name: data.name,
        description: data.description,
        updated: Math.round((new Date()).getTime() / 1000),
        changesetComment: data.changesetComment,
        stats: result.body.stats,
        loadStatus: result.body.loadStatus,
        entitiesToFix: data.entitiesToFix,
        detailedInstructions: data.detailedInstructions,
        priority: data.priority,
        status: data.status,
        imagery: data.imagery
      }
    };
    if (data.file) {
      task.body.stats.push({
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
        if (geojsonhint.hint(file) && path.extname(geojsonFile) === '.geojson') { //check  more detail the data
          var backupFile = path.join(folder, idtask + '-' + randomString({
            length: 5
          }) + '.json');
          task.body.stats[task.body.stats.length - 2]['backupFile'] = backupFile;
          var childSave = childProcess.fork('./src/utils/saveGeojsonFromDB');
          childSave.send({
            task: task
          });
          childSave.on('message', function(props) {
            //load the data
            var child = childProcess.fork('./src/utils/loadGeojsonToDB');
            child.send({
              file: geojsonFile,
              task: task
            });
            child.on('message', function(props) {
              if (props.result) {
                //update when the load is complete
                props.result.task.body.loadStatus = 'complete';
                db.tasks.update({
                  id: props.result.task.id
                }, {
                  body: props.result.task.body
                }, function(err, res) {
                  if (err) return reply(boom.badRequest(err));
                  console.log('load completed');
                });

              } else {
                //error saving the data
                result.task.body.loadStatus = 'error';
                db.tasks.update({
                  id: result.task.id
                }, {
                  body: result.task.body
                }, function(err, res) {
                  if (err) return reply(boom.badRequest(err));
                  console.log('Error loading te data');
                });
              }
            });
          });
          //response the update don't need wait, it also status marked as loading
          task.body.loadStatus = 'loading';
          db.tasks.update({
            id: task.id
          }, {
            body: task.body
          }, function(err, res) {
            if (err) return reply(boom.badRequest(err));
            reply(res);
          });
        } else {
          reply(boom.badData('The data is bad and you should fix it'));
        }
      });
    } else {
      db.tasks.update({
        id: task.id
      }, {
        body: task.body
      }, function(err, res) {
        if (err) return reply(boom.badRequest(err));
        return reply(res);
      });
    }
  });
};
module.exports.deleteTasks = function(request, reply) {
  db.tasks.update({
    idstr: request.params.idtask
  }, {
    'status': false //for now set a
  }, function(err, res) {
    if (err) return reply(boom.badRequest(err));
    return reply(res);
  });
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
      if (!data[v.body.user]) {
        data[v.body.user] = {
          edit: 0,
          fixed: 0,
          noterror: 0,
          skip: 0,
          user: v.body.user
        };
        data[v.body.user][v.body.action] = data[v.body.user][v.body.action] + 1;
      } else {
        data[v.body.user][v.body.action] = data[v.body.user][v.body.action] + 1;
      }
    });
    reply({
      updated: Math.round((new Date()).getTime() / 1000),
      stats: _.values(data)
    });
  });
};