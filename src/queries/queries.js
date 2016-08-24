'use strict';
var queries = {};
queries.selectItem = function(idtask) {
  return `SELECT idstr, "time", body FROM ${idtask} WHERE "time" < $1 limit 1;`;
};
queries.selectItemById = function(idtask) {
  return `SELECT idstr, "time", body FROM ${idtask} WHERE idstr = $1 limit 1;`;
};
queries.updateItemById = function(idtask) {
  return `UPDATE ${idtask} SET "time"=$1, body=($2::JSONB) WHERE idstr=$3;`;
};
queries.createTable = function(idtask) {
  return `CREATE TABLE ${idtask}(idstr varchar(50), time integer, body jsonb ); CREATE INDEX idx_${idtask}_body ON ${idtask} USING GIN (body); CREATE INDEX idx_${idtask}_idstr ON ${idtask}(idstr);`;
};
queries.createTableStats = function(idtask) {
  return `CREATE TABLE ${idtask}_stats( "time" integer, body jsonb);CREATE INDEX idx_time_${idtask} ON ${idtask}_stats("time");`;
};
queries.deleteRowsTable = function(idtask) {
  return `DELETE FROM ${idtask};`;
};
queries.selectRowsTable = function(idtask) {
  return `SELECT body FROM ${idtask};`;
};
queries.selectItemtoUpdate = function(idtask) {
  return `SELECT idstr, "time", body FROM ${idtask} WHERE idstr = $1;`;
};
queries.selectAllItems = function(idtask) {
  return `SELECT body FROM ${idtask};`;
};
queries.selectATask = function() {
  return 'SELECT body FROM tasks where idstr=$1';
};
queries.updateATask = function() {
  return 'UPDATE tasks SET body=($1::JSONB) WHERE idstr=$2;';
};
queries.insertActivity = function(idtask) {
  return `INSERT INTO ${idtask}_stats("time", body)VALUES ($1, $2);`;
};
queries.selectActivity = function(idtask) {
  return `SELECT "time", body as attributes FROM ${idtask}_stats WHERE time < $1 AND time > $2;`;
};
queries.selectActivityByUser = function(idtask) {
  return `SELECT "time", body as attributes FROM ${idtask}_stats WHERE time < $1 AND time > $2 AND cast(body->>'user'as text) = $3;`;
};
queries.selectTrackStats = function(idtask) {
  return `SELECT body FROM ${idtask}_stats WHERE time < $1 AND time > $2;`;
};

module.exports = queries;
