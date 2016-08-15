'use strict';
var queries = {};
queries.selectItem = function(idtask) {
  return `SELECT id, idstr, "time", body FROM ${idtask} WHERE "time" < $1 limit 1;`;
};
queries.selectItemById = function(idtask) {
  return `SELECT id, idstr, "time", body FROM ${idtask} WHERE idstr = $1 limit 1;`;
};
queries.updateItemById = function(idtask) {
  return `UPDATE ${idtask} SET "time"=$1, body=($2::JSONB) WHERE id=$3;`;
};
queries.createTable = function(idtask) {
  return `CREATE TABLE ${idtask}( id serial PRIMARY KEY, idstr varchar(50), time integer, body jsonb );`;
};
queries.selectItemtoUpdate = function(idtask) {
  return `SELECT id, idstr, "time", body FROM ${idtask} WHERE idstr = $1;`;
};
queries.selectAllItems = function(idtask) {
  return `SELECT body  FROM ${idtask};`;
};
module.exports = queries;
