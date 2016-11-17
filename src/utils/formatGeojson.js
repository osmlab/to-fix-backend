'use strict';
var fs = require('fs');
var JSONStream = require('JSONStream');
var eventStream = require('event-stream');
var os = require('os');
var path = require('path');
var sha1 = require('sha1');
var _ = require('underscore');
var folder = os.tmpDir();
//These are the most usual id which come in geojson files
var ids = ['id', '_id', '_fromWay', '_toWay'];

function handleData(data, file, es) {
  var hash = sha1(JSON.stringify(data));
  var time = Math.round((new Date()).getTime() / 1000);
  data.properties._key = hash;
  data.properties._time = time;
  //for while lest set up the type of osm object, here
  if (data.geometry.type === 'MultiPoint' || data.geometry.type === 'LineString' || data.geometry.type === 'MultiLineString' || data.geometry.type === 'Polygon' || data.geometry.type === 'MultiPolygon') {
    data.properties._osmType = 'way';
  } else if (data.geometry.type === 'Point') {
    data.properties._osmType = 'node';
  }
  var keys = _.keys(data.properties);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i].replace(/[^A-Za-z]/g, '_');
    if (key !== keys[i]) {
      data.properties[key] = data.properties[keys[i]];
      delete data.properties[keys[i]];
    }
    if (ids.indexOf(key) > -1) {
      data.properties._osmId = data.properties[key];
      //for overpass geojson files
      var typeId = data.properties._osmId.toString().split('\/');
      if (typeId.length === 2) {
        data.properties._osmId = typeId[1];
        data.properties._osmType = typeId[0];
      }
    }
  }
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
