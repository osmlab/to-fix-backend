'use strict';
const queries = require('./../queries/queries');

module.exports.createTable = function(request, idtask, done) {
  var client = request.pg.client;
  console.log(`CREATE TABLE : ${idtask}`);
  client.query(queries.createTable(idtask), function(err, result) {
    done(err, result);
  });
};