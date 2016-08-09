'use strict';
var fs = require('fs');
var copyFrom = require('pg-copy-streams').from;
var os = require('os');
var path = require('path');
var folder = os.tmpDir();
var pg = require('pg');
var config = require('./../configs/config');

module.exports.uploadtoDB = function(request, task, cb) {
  //lets do other connection, because  request.pg.client; does not work
  pg.connect(config.connectionString, function(err, client, done) {
    if (err) cb(err, null);
    var file = path.join(folder, task.idtask);
    var stream = client.query(copyFrom('COPY tmp_' + task.idtask + ' FROM STDIN'));
    var fileStream = fs.createReadStream(file);
    fileStream.on('error', function(err) {
      fs.unlinkSync(file);
      cb(err, null);
    });
    fileStream.pipe(stream).on('finish', function() {
      fs.unlinkSync(file);
      cb(null, task);
    }).on('error', function(err) {
      fs.unlinkSync(file);
      cb(err, null);
    });
  });
};
