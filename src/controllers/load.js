const fs = require('fs');
const os = require('os');
const path = require('path');
const massive = require("massive");
const shortid = require('shortid');
const config = require('./../configs/config');
process.on('message', function(props) {
  massive.connect({
    connectionString: config.connectionString
  }, function(err, db) {
    var geojson = JSON.parse(fs.readFileSync(props.file, 'utf8'));
    for (var i = 0; i < geojson.features.length; i++) {
      var v = geojson.features[i];
      var item = {
        idstr: shortid.generate(),
        time: Math.round((new Date()).getTime() / 1000),
        body: v
      };
      db[props.id].insert(item, function(err, result) {
        console.log(result.id);
      });
    }
    console.log('[child] received message from server:', props);
    process.send({
      child: process.pid,
      result: props
    });
    process.disconnect();
  });
});