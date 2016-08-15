'use strict';
const fs = require('fs');
const massive = require('massive');
const shortid = require('shortid');
const config = require('./../configs/config');
process.on('message', (props) => {
  massive.connect({
    connectionString: config.connectionString
  }, (err, db) => {
    if (err) console.log(err);
    const geojson = JSON.parse(fs.readFileSync(props.file, 'utf8'));
    for (let i = 0; i < geojson.features.length; i++) {
      let feature = geojson.features[i];
      let item = {
        idstr: shortid.generate(),
        time: Math.round((new Date()).getTime() / 1000),
        body: feature
      };
      db[props.task.idstr].insert(item, (err, result) => {
        if (err) console.log(err);
        console.log(`insert: ${result.id}`);
        if ((i + 1) === geojson.features.length) {
          let history = {
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
