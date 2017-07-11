'use strict';
var fs = require('fs');
var JSONStream = require('JSONStream');
var eventStream = require('event-stream');
var os = require('os');
var path = require('path');
var sha1 = require('sha1');
var _ = require('underscore');
var folder = os.tmpdir();
//These are the most usual ids which come in geojson files.
var ids = ['id', '_id', '_fromWay', '_toWay'];
var avoidDuplicates = [];
module.exports = {
  formatGeojson,
  formatFeature
};

function handleData(data, file) {
  data = formatFeature(data);
  if (avoidDuplicates.indexOf(data.properties._key) < 0) {
    avoidDuplicates.push(data.properties._key);
    var row = `${JSON.stringify(data)}\n`;
    fs.appendFile(file, row, function(err) {
      if (err) console.log(err);
    });
  }
}
/**
 * Stream a GeoJSON file to count the number of rows
 * @param {string} geojsonFile path to a local GeoJSON file
 * @param {object} task metadata
 * @param {function} cb success callback passing updated task as parameter
 * @returns {object} task with `items` property
 */
function formatGeojson(geojsonFile, task, cb) {
  var numRows = 0;
  var file = path.join(folder, task.idtask);
  fs.writeFileSync(file, '');
  var fileStream = fs.createReadStream(geojsonFile, {
    encoding: 'utf8'
  });
  fileStream.pipe(JSONStream.parse('features.*'))
    .pipe(eventStream.mapSync(function(data) {
      handleData(data, file);
      return data
    })).on('error', function(err) {
      console.log(err)
    }).on('close', function() {
      task.value.stats[task.value.stats.length - 1].date = task.value.updated;
      task.value.stats[task.value.stats.length - 1].items = avoidDuplicates.length;
      cb(task);
    });
}

/**
 * Format the data
 * - add _key, hash of the feature
 * - add _time, current time
 * - add _osmId , which is the id of osm object
 * - add _osmType, which is the type of osm object
 * @param {object} a feature of geojson
 * @returns {object} a feature which will be a item in ES
 */
function formatFeature(data) {
  var hash = sha1(JSON.stringify(data));
  var time = Math.round((new Date()).getTime() / 1000);
  data.properties._key = hash;
  data.properties._time = time;
  if (data.properties.relations) {
    data.properties._osmType = 'relation';
  } else if (data.geometry.type === 'MultiPoint' || data.geometry.type === 'LineString' || data.geometry.type === 'MultiLineString' || data.geometry.type === 'Polygon' || data.geometry.type === 'MultiPolygon') {
    data.properties._osmType = 'way';
  } else if (data.geometry.type === 'Point') {
    data.properties._osmType = 'node';
  }
  data = replaceSC(data);
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    if (data.properties[id]) {
      data.properties._osmId = data.properties[id];
      //format overpass geojson files
      data.properties[id] = parseInt((data.properties[id].toString()).replace(/^\D+/g, ''));
      var typeId = data.properties._osmId.toString().split('\_');
      if (typeId.length === 2) {
        data.properties._osmId = typeId[1];
        data.properties._osmType = typeId[0];
      }
    }
  }
  return data;
}

function replaceSC(obj) {
  if (_.isArray(obj)) {
    for (var k = 0; k < obj.length; k++) {
      obj[k] = replaceSC(obj[k]);
    }
  } else {
    var keys = _.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i].replace(/[^A-Za-z]/g, '_');
      if (key !== keys[i]) {
        obj[key] = obj[keys[i]];
        delete obj[keys[i]];
      }
      /*eslint valid-typeof: "error"*/
      if (_.isObject(obj[key]) && key !== 'geometry') {
        obj[key] = replaceSC(obj[key]);
      } else if (typeof obj[key] === 'string' || obj[key] instanceof String) {
        obj[key] = obj[key].replace(/[^a-zA-Z0-9]/g, '_');
      }
    }
  }
  return obj;
}
