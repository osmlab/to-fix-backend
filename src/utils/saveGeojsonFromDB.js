'use strict';
var fs = require('fs');
var pg = require('pg');
var copyTo = require('pg-copy-streams').to;
var config = require('./../configs/config');

module.exports.saveBackup = function(task, cb) {
  var backupFile = task.value.stats[task.value.stats.length - 2].backupFile;
  //this file should be upload to S3, to save the history and not an error  items
  var wstream = fs.createWriteStream(backupFile);
  pg.connect(config.connectionString, function(err, client, done) {
    if (err) {
      console.log(err);
      cb(err, null);
    }
    var stream = client.query(copyTo('COPY ' + task.idtask + ' TO STDOUT'));
    stream.pipe(wstream);
    stream.on('end', function() {
      cb(null, task);
    });
    stream.on('error', function(err) {
      if (err) {
        console.log(err);
        cb(err, null);
      }
    });
  });
};
