'use strict';
var queries = require('./../queries/queries');

module.exports.createTable = function(request, idtask, done) {
  var client = request.pg.client;
  client.query(queries.createTable(idtask), function(err, result) {
    done(err, result);
  });
};
module.exports.createTableStats = function(request, idtask, done) {
  var client = request.pg.client;
  client.query(queries.createTableStats(idtask), function(err, result) {
    done(err, result);
  });
};
module.exports.deleteRowsTable = function(request, idtask, done) {
  var client = request.pg.client;
  client.query(queries.deleteRowsTable(idtask), function(err, result) {
    done(err, result);
  });
};
module.exports.selectRowsTable = function(request, idtask, done) {
  var client = request.pg.client;
  client.query(queries.selectRowsTable(idtask), function(err, result) {
    done(err, result);
  });
};
