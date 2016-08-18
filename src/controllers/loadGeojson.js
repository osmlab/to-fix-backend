'use strict';
var fs = require('fs');
var massive = require('massive');
var shortid = require('shortid');
var uuid = require('node-uuid');

var config = require('./../configs/config');
process.on('message', function(props) {
  massive.connect({
    connectionString: config.connectionString
  }, function(err, db) {
    if (err) console.log(err);
    var geojson = JSON.parse(fs.readFileSync(props.file, 'utf8'));
    for (let i = 0; i < geojson.features.length; i++) {
      var feature = geojson.features[i];
      var item = {
        idstr: shortid.generate(),
        time: props.task.body.updated,
        body: feature
      };
      db[props.task.idstr].insert(item, function(err, result) {
        if (err) console.log(err);
        console.log(`insert: ${result.id}`);
        if (i + 1 === geojson.features.length) {
          props.task.body.stats[props.task.body.stats.length - 1].date = props.task.body.updated;
          props.task.body.stats[props.task.body.stats.length - 1].items = geojson.features.length;
          process.send({
            child: process.pid,
            result: props
          });
          process.disconnect();
        }
      });
    }
  });
});
