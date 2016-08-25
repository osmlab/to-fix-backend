'use strict';
var fs = require('fs');
var massive = require('massive');
var randomString = require('random-string');
var JSONStream = require('JSONStream');
var eventStream = require('event-stream');
var copyFrom = require('pg-copy-streams').from;
var os = require('os');
var path = require('path');
var folder = os.tmpDir();
var _ = require('underscore');
var pg = require('pg');
var config = require('./../configs/config');

function handleData(data, file, es) {
  var idstr = randomString({
    length: 15
  }).toLowerCase();
  data.properties = _.mapObject(data.properties, function(val, key) {
    return val.replace(/[^\w\s]/gi, '');
  });
  var time = Math.round((new Date()).getTime() / 1000);
  var row = `${idstr}\t${time}\t${JSON.stringify(data)}\n`;
  fs.appendFile(file, row, function(err) {
    if (err) console.log(err);
    es.resume();
  });
}
process.on('message', function(props) {
  var numRows = 0;
  var file = path.join(folder, props.task.idstr);
  pg.connect(config.connectionString, function(err, client, done) {
    if (err) console.log(err);
    var fileStream = fs.createReadStream(props.file, {
      encoding: 'utf8'
    });
    fileStream.pipe(JSONStream.parse('features.*')).pipe(eventStream.through(function(data) {
      numRows++;
      this.pause();
      handleData(data, file, this);
      return data;
    }, function end() {
      uploadtoDB(props, file, numRows, function(p) {
        process.send({
          child: process.pid,
          result: p
        });
        process.disconnect();
      });
      this.emit('end');
    }));
  });
});

function uploadtoDB(props, file, numRows, callback) {
  pg.connect(config.connectionString, function(err, client, done) {
    if (err) console.log(err);
    var stream = client.query(copyFrom('COPY ' + props.task.idstr + ' FROM STDIN'));
    var fileStream = fs.createReadStream(file);
    fileStream.on('error', theEnd);
    fileStream.pipe(stream).on('finish', function() {
      props.task.body.stats[props.task.body.stats.length - 1].date = props.task.body.updated;
      props.task.body.stats[props.task.body.stats.length - 1].items = numRows;
      callback(props);
    }).on('error', theEnd);
  });
}

function theEnd(err) {
  if (err) {
    console.log(err);
    process.send({
      child: process.pid,
      err: err
    });
    process.disconnect();
  }
}