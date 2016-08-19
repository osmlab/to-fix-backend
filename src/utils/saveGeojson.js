'use strict';
var fs = require('fs');
var config = require('./../configs/config');
var queries = require('./../queries/queries');
var pg = require('pg');
var copyTo = require('pg-copy-streams').to;
process.on('message', function(props) {
  var backupFile = props.task.body.stats[props.task.body.stats.length - 2].backupFile;
  //this file should be upload to S3, to save the history and not an error  items
  var wstream = fs.createWriteStream(backupFile);
  pg.connect(config.connectionString, function(err, client, done) {
    if (err) console.log(err);
    var stream = client.query(copyTo('COPY ' + props.task.idstr + ' TO STDOUT'));
    stream.pipe(wstream);
    stream.on('end', function() {
      //remove all previous items rows on table
      client.query(queries.deleteRowsTable(props.task.idstr), function(err, result) {
        if (err) console.log(err);
        process.send({
          child: process.pid,
          result: props
        });
        process.disconnect();
        done();
      });
    });
    stream.on('error', function(err) {
      if (err) console.log(err);
    });
  });
});
