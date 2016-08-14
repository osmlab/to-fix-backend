'use strict';

const massive = require("massive");
const boom = require('boom');
const fs = require('fs');
const os = require('os');
const path = require('path');
const geojsonhint = require('geojsonhint');
const child_process = require('child_process');
const shortid = require('shortid');
const util = require('./../utils/util');
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
        load_status: 'loading'
      }
    };
    const name = data.file.hapi.filename;
    const geojsonFile = path.join(folder, name);
    const file = fs.createWriteStream(geojsonFile);
    file.on('error', (err) => {
      console.log(err);
    });
    data.file.pipe(file);
    data.file.on('end', (err) => {
      if (geojsonhint.hint(file) && path.extname(geojsonFile) === '.geojson') { //check  more detail the data
        util.createTable(request, task.idstr, (err, result) => {
          if (err) {
            console.log(err);
          } else {
            //save task
            db.tasks.save(task, (err, result) => {
              if (err) {
                console.log(err);
              }
              reply(result);
              db.loadTables((err, db) => {
                console.log('reload tables');
              });
              //insert data into DB
              var child = child_process.fork('./src/controllers/load');
              child.send({
                file: geojsonFile,
                task: result
              });
              child.on('message', (props) => {
                //update when the load is complete
                props.result.task.body.load_status = 'complete';
                db.tasks.update({
                  id: props.result.task.id,
                }, {
                  body: props.result.task.body
                }, (err, res) => {
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

