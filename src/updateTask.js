var crontab = require('node-crontab');
var moment = require('moment');
var s3 = require('./aws');

module.exports = function(client) {
  s3.listFiles(function(list) {
    var listFiles = {};
    for (var i = 0; i < list.length; i++) {
      var localDate = new Date(list[i].LastModified);
      var timestamp = localDate.getTime() / 1000;
      list[i].LastModified = timestamp;
      var key = list[i].Key.split('/')[2].replace(/[^a-zA-Z]+/g, '').toLowerCase();
      key = key.substring(0, key.length - 3);
      listFiles[key] = list[i];
    }
    var query = 'SELECT id, source, tasktable, updated, status FROM task_details;';
    var cliente = client.query(query, function(err, results) {
      results.rows.forEach(function(row) {
        if (listFiles[row.id] && listFiles[row.id].LastModified > row.updated) {
          console.log('update task');
        }
      });
    });
  });
};