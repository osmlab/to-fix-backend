'use strict';
var fs = require('fs');
var massive = require('massive');
var shortid = require('shortid');
var config = require('./../configs/config');
process.on('message', (props) => {
  massive.connect({
    connectionString: config.connectionString
  }, function(err, db) {
    if (err) console.log(err);
    var geojson = JSON.parse(fs.readFileSync(props.file, 'utf8'));
    for (var i = 0; i < geojson.features.length; i++) {
      var feature = geojson.features[i];
      var item = {
        idstr: shortid.generate(),
        time: Math.round((new Date()).getTime() / 1000),
        body: feature
      };
      db[props.task.idstr].insert(item, function(err, result)  {
        if (err) console.log(err);
        console.log(`insert: ${result.id}`);
        if ((i + 1) === geojson.features.length) {
          var history = {
            date: Math.round((new Date()).getTime() / 1000),
            items: geojson.features.length
          };
          if (props.task.body.history) {
            props.task.body.history.push(history);
          } else {
            props.task.body.history = [history];
          }
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
