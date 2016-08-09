'use strict';
var fs = require('fs');
var randomString = require('random-string');
var JSONStream = require('JSONStream');
var eventStream = require('event-stream');
var os = require('os');
var path = require('path');
var folder = os.tmpDir();
var _ = require('underscore');

function handleData(data, file, es) {
  var key = randomString({
    length: 25
  }).toLowerCase();
  data.properties = _.mapObject(data.properties, function(val, key) {
    return val.replace(/"/g, '').replace(/\n/g, '').replace(/\\/g, '').replace(/[^\w\s]/gi, '');
  });
  var time = Math.round((new Date()).getTime() / 1000);
  var row = `${key}\t${time}\t${JSON.stringify(data)}\n`;
  fs.appendFile(file, row, function(err) {
    if (err) console.log(err);
    es.resume();
  });
}

module.exports.formatGeojson = function(geojsonFile, task, cb) {
  var numRows = 0;
  var file = path.join(folder, task.idtask);
  var fileStream = fs.createReadStream(geojsonFile, {
    encoding: 'utf8'
  });
  fileStream.pipe(JSONStream.parse('features.*')).pipe(eventStream.through(function(data) {
    numRows++;
    this.pause();
    handleData(data, file, this);
    return data;
  }, function end() {
    task.value.stats[task.value.stats.length - 1].date = task.value.updated;
    task.value.stats[task.value.stats.length - 1].items = numRows;
    cb(task);
    this.emit('end');
  }));
};
