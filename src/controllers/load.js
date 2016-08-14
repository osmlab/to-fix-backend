'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const massive = require("massive");
const shortid = require('shortid');
const config = require('./../configs/config');
process.on('message', (props) => {
  massive.connect({
    connectionString: config.connectionString
  }, (err, db) => {
    const geojson = JSON.parse(fs.readFileSync(props.file, 'utf8'));
    for (let i = 0; i < geojson.features.length; i++) {
      let feature = geojson.features[i];
      let item = {
        idstr: shortid.generate(),
        time: Math.round((new Date()).getTime() / 1000),
        body: feature
      };
      db[props.task.idstr].insert(item, (err, result) => {
        console.log(`insert: ${result.id}`);
        if ((i + 1) === geojson.features.length) {
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