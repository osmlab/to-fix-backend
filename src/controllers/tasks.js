'use strict';

const massive = require("massive");
const boom = require('boom');
const fs = require('fs');
const os = require('os');
const path = require('path');
const geojsonhint = require('geojsonhint');
const shortid = require('shortid');
const table = require('./../utils/table');
const config = require('./../configs/config');

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
    const task = {
      idstr: data.name.concat(shortid.generate()).replace(/[^a-zA-Z]+/g, '').toLowerCase(),
      name: data.name,
      idproject: data.idproject,
      description: data.description,
      updated: Math.round((new Date()).getTime() / 1000),
      status: true,
      changeset_comment: data.changeset_comment,
    };
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
              return reply(result);
            });
            loadData(geojsonFile, task.idstr, function() {});
          }
        });
      } else {
        reply(boom.badData('The data is bad and you should fix it'));
      }
    });
  }
};

function loadData(geojsonFile, idstr, done) {
  massive.connect({ //do other conenction to do this faster
    connectionString: config.connectionString
  }, function(err, newdb) {
    var geojson = JSON.parse(fs.readFileSync(geojsonFile, 'utf8'));
    for (var i = 0; i < geojson.features.length; i++) { //need to improve here
      var v = geojson.features[i];
      var item = {
        idsrt: shortid.generate(),
        time: Math.round((new Date()).getTime() / 1000),
        body: v
      };
      newdb[idstr].insert(item, function(err, result) {
        console.log(result.id);
      });
    }
    done();
  });
}