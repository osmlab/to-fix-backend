'use strict';

const massive = require("massive");
const boom = require('boom');
const fs = require('fs');
const os = require('os');
const path = require('path');
const geojsonhint = require('geojsonhint');
var child_process = require('child_process');
const shortid = require('shortid');
const table = require('./../utils/table');
const config = require('./../configs/config');
const folder = os.tmpDir();

let db = massive.connectSync({
  connectionString: config.connectionString
});

module.exports.listTasks = function(request, reply) {
  db.tasks.find({}, function(err, tasks) {
    reply(tasks);
  });
};

module.exports.createTasks = function(request, reply) {
  const data = request.payload;
  if (data.file) {
    let task = {
      idstr: data.name.concat(shortid.generate()).replace(/[^a-zA-Z]+/g, '').toLowerCase(),
      idproject: data.idproject,
      body: {
        name: data.name,
        description: data.description,
        updated: Math.round((new Date()).getTime() / 1000),
        status: true,
        changeset_comment: data.changeset_comment,
      }
    };
    const name = data.file.hapi.filename;
    const geojsonFile = path.join(folder, name);
    const file = fs.createWriteStream(geojsonFile);
    file.on('error', function(err) {
      console.error(err);
    });
    data.file.pipe(file);
    data.file.on('end', function(err) {
      if (geojsonhint.hint(file) && path.extname(geojsonFile) === '.geojson') { //check  more detail the data
        table.createtable(request, task.idstr, function(err, result) {
          if (err) {
            console.log(err);
          } else {

            db.tasks.save(task, function(err, result) {
              if (err) {
                console.log(err);
              }
              db.loadTables(function(err, db) {
                console.log('reload tables');
              });
              reply(result);
            });
            //load the data
            var child = child_process.fork('./src/controllers/load');
            child.send({
              file: geojsonFile,
              id: task.idstr
            });
            child.on('message', function(message) {
              db.loadTables(function(err, db) {
                console.log('reload tables');
              });
            });
            // loadData(geojsonFile, task.idstr, function() {});
          }
        });
      } else {
        reply(boom.badData('The data is bad and you should fix it'));
      }
    });
  }
};