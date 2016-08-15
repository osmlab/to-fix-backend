'use strict';
var massive = require('massive');
var boom = require('boom');
var fs = require('fs');
var os = require('os');
var path = require('path');
var geojsonhint = require('geojsonhint');
var childProcess = require('child_process');
var shortid = require('shortid');
var util = require('./../utils/util');
var config = require('./../configs/config');
var folder = os.tmpDir();

var db = massive.connectSync({
  connectionString: config.connectionString
});

module.exports.listTasks = function(request, reply) {
  db.tasks.find({}, function(err, tasks) {
    if (err) return reply(boom.badRequest(err));
    return reply(tasks);
  });
};

module.exports.createTasks = function(request, reply) {
  var data = request.payload;
  if (data.file) {
    var task = {
      idstr: data.name.concat(shortid.generate()).replace(/[^a-zA-Z]+/g, '').toLowerCase(),
      idproject: data.idproject,
      body: {
        name: data.name,
        description: data.description,
        updated: Math.round((new Date()).getTime() / 1000),
        status: true,
        changeset_comment: data.changeset_comment,
        load_status: 'loading'
      }
    };
    var name = data.file.hapi.filename;
    var geojsonFile = path.join(folder, name);
    var file = fs.createWriteStream(geojsonFile);
    file.on('error', function(err) {
      if (err) {
        return reply(boom.badRequest(err));
      }
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
            //save task
            db.tasks.save(task, function(err, result) {
              if (err) {
                return reply(boom.badRequest(err));
              }
              reply(result);
              db.loadTables(function(err, db) {
                if (err) return reply(boom.badRequest(err));
                console.log('reload tables');
              });
              //insert data into DB
              var child = childProcess.fork('./src/controllers/load');
              child.send({
                file: geojsonFile,
                task: result
              });
              child.on('message', function(props) {
                //update when the load is complete
                props.result.task.body.load_status = 'complete';
                db.tasks.update({
                  id: props.result.task.id
                }, {
                  body: props.result.task.body
                }, function(err, res) {
                  if (err) return reply(boom.badRequest(err));
                  console.log(res);
                });
              });
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
      body: {
        name: data.name,
        description: data.description,
        updated: Math.round((new Date()).getTime() / 1000),
        status: true,
        changeset_comment: data.changeset_comment,
        history: result.body.history,
        load_status: result.body.history
      }
    };

    if (data.file) {
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
          task.body.load_status = 'loading';
          db.tasks.update({
            id: task.id
          }, {
            body: task.body
          }, function(err, res) {
            if (err) return reply(boom.badRequest(err));
            reply(res);
          });
          //load the data
          var child = childProcess.fork('./src/controllers/load');
          child.send({
            file: geojsonFile,
            task: task
          });
          child.on('message', function(props) {
            //update when the load is complete
            props.result.task.body.load_status = 'complete';
            db.tasks.update({
              id: props.result.task.id
            }, {
              body: props.result.task.body
            }, function(err, res) {
              if (err) return reply(boom.badRequest(err));
              console.log(res);
            });
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