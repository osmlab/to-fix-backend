'use strict';
const massive = require("massive");
const boom = require('boom');
const fs = require('fs');
const os = require('os');
const path = require('path');
const geojsonhint = require('geojsonhint');
const uuid = require('node-uuid');
const table = require('./../utils/table');
const config = require('./../configs/config');

let db = massive.connectSync({
  connectionString: config.connectionString
});

module.exports.listTasks = function(request, reply) {
  db.tasks.find({},function(err, tasks) {
    reply(tasks);
  });
};

module.exports.findeOne = function(request, reply) {
  const now = Math.round((new Date()).getTime() / 1000);
  const idtask = request.params.idtask;
  db[idtask].findOne({
    "time <": now
  }, function(err, item) {
    reply(item);
    db[idtask].save({
      id: item.id,
      time: now + config.lockPeriod
    }, function(err, updated) {
      console.log('was updated ' + updated);
    });
  });
};

module.exports.createTasks = function(request, reply) {
  //create
  const data = request.payload;
  if (data.file) {
    const task = {
      idstr: data.idstr,
      name: data.name,
      description: data.description,
      updated: Math.round((new Date()).getTime() / 1000),
      status: true,
      changeset_comment: data.changeset_comment,
    };
    const idstr = data.idstr;
    const name = data.file.hapi.filename;
    const folder = os.tmpDir();
    const geojsonFile = path.join(folder, name);
    const file = fs.createWriteStream(geojsonFile);
    file.on('error', function(err) {
      console.error(err);
    });
    data.file.pipe(file);
    data.file.on('end', function(err) {
      if (geojsonhint.hint(file) && path.extname(geojsonFile) === '.geojson') { //check  more detail the data
        table.createtable(request, idstr, function(err, result) {
          if (err) {} else {
            loadData(geojsonFile, idstr, function(newdb) {
              db = newdb;
              db.tasks.save(task, function(err, result) {
                if (err) {
                  console.log(err);
                }
                reply(result);
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

function loadData(geojsonFile, idstr, done) {
  massive.connect({
    connectionString: config.connectionString
  }, function(err, db) {
    var geojson = JSON.parse(fs.readFileSync(geojsonFile, 'utf8'));
    for (var i = 0; i < geojson.features.length; i++) { //need to improve here
      var v = geojson.features[i];
      var item = {
        idsrt: uuid.v4(),
        time: Math.round((new Date()).getTime() / 1000),
        body: v
      };
      db[idstr].insert(item, function(err, result) {
        console.log(result.id);
      });
    }
    done(db);
  });
}