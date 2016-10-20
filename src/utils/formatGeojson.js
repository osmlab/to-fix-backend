'use strict';
var fs = require('fs');
var JSONStream = require('JSONStream');
var eventStream = require('event-stream');
var os = require('os');
var path = require('path');
var sha1 = require('sha1');
var folder = os.tmpDir();

function handleData(data, file, es) {
  var hash = sha1(JSON.stringify(data));
  var time = Math.round((new Date()).getTime() / 1000);
  data.properties._key = hash;
  data.properties._time = time;
  var row = `${JSON.stringify(data)}\n`;
  fs.appendFile(file, row, function(err) {
    if (err) console.log(err);
    es.resume();
  });
}

module.exports.formatGeojson = function(geojsonFile, task, cb) {
  var numRows = 0;
  var file = path.join(folder, task.idtask);
  fs.writeFile(file, '');
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
