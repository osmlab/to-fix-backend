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
  //some features does not have the geometry atribute
  if (data.geometry.type) {
    var key = randomString({
      length: 25
    }).toLowerCase();
    var time = Math.round((new Date()).getTime() / 1000);
    data.properties = _.mapObject(data.properties, function(v, k) {
      return v.replace(/"/g, '').replace(/\n/g, '').replace(/\\/g, '').replace(/[^\w\s]/gi, '');
    });
    data.properties._key = key;
    data.properties._time = time;
    var row = `${JSON.stringify(data)}\n`;
    fs.appendFile(file, row, function(err) {
      if (err) console.log(err);
      es.resume();
    });
  } else {
    es.resume();
  }
}

module.exports.formatGeojson = function(geojsonFile, task, cb) {
  var numRows = 0;
  var file = path.join(folder, task.idtask);
  fs.writeFile(file, '');
  var fileStream = fs.createReadStream(geojsonFile, {
    encoding: 'utf8'
  });
  fileStream.pipe(JSONStream.parse('features.*')).pipe(eventStream.through(function(data) {
    //fix the number of items, we are filtering some bad features 
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
