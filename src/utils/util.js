'use strict';
var queries = require('./../queries/queries');

module.exports.createTable = function(request, idtask, done) {
  var client = request.pg.client;
  console.log(`CREATE TABLE : ${idtask}`);
  client.query(queries.createTable(idtask), function(err, result) {
    done(err, result);
  });
};

module.exports.createTableStats = function(request, idtask, done) {
  var client = request.pg.client;
  console.log(`CREATE TABLE : ${idtask}_stats`);
  client.query(queries.createTableStats(idtask), function(err, result) {
    done(err, result);
  });
};

