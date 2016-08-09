'use strict';
var queries = {};
//tasks
queries.saveATask = function() {
  return 'INSERT INTO tasks(idtask, status, value) VALUES ($1, $2, $3::JSONB);';
};
queries.selectTasksById = function() {
  return 'SELECT value FROM tasks where idtask=$1';
};
queries.selectTasks = function() {
  return 'SELECT value FROM tasks WHERE status=true;';
};
queries.deleteTasksById = function() {
  return 'UPDATE tasks SET status=$1 WHERE idtask=$2;';
};
queries.dropTableTask = function(idtask) {
  return `DROP TABLE ${idtask}; DROP TABLE ${idtask}_stats; `;
};
queries.updateATask = function() {
  return 'UPDATE tasks SET value=($1::JSONB) WHERE idtask=$2;';
};
queries.insertActivity = function(idtask) {
  return `INSERT INTO ${idtask}_stats("time", value)VALUES ($1, $2);`;
};
queries.selectActivity = function(idtask) {
  return `SELECT "time", value as attributes FROM ${idtask}_stats WHERE time < $1 AND time > $2;`;
};
queries.selectActivityByUser = function(idtask) {
  return `SELECT "time", value as attributes FROM ${idtask}_stats WHERE time < $1 AND time > $2 AND cast(value->>'user'as text) = $3;`;
};
queries.selectTrackStats = function(idtask) {
  return `SELECT value FROM ${idtask}_stats WHERE time < $1 AND time > $2;`;
};
queries.deleteRowsTable = function(idtask) {
  return `DELETE FROM ${idtask};`;
};
queries.selectRowsTable = function(idtask) {
  return `SELECT value FROM ${idtask};`;
};
//Tables
queries.createTempTable = function(idtask) {
  return `CREATE TABLE tmp_${idtask}(key varchar(50) UNIQUE,time integer,value jsonb);`;
};
queries.dropTempTable = function(idtask) {
  return `DROP TABLE tmp_${idtask};`;
};
queries.createTables = function(idtask) {
  return `CREATE TABLE ${idtask}(key varchar(50) UNIQUE,time integer,value jsonb);
          CREATE INDEX idx_${idtask}_value ON ${idtask} USING GIN (value);
          CREATE INDEX idx_${idtask}_key ON ${idtask}(key);
          CREATE TABLE ${idtask}_stats("time" integer,value jsonb);
          CREATE INDEX idx_time_${idtask}_stats ON ${idtask}_stats("time");`;
};
queries.copyFromTmptoTable = function(idtask) {
  return `INSERT INTO ${idtask}(key, "time", value) SELECT key, "time", value FROM tmp_${idtask};`;
};
//items
queries.selectItem = function(idtask) {
  return `SELECT key, "time", value FROM ${idtask} WHERE "time" < $1 limit 1;`;
};
queries.selectItemById = function(idtask) {
  return `SELECT key, "time", value FROM ${idtask} WHERE key = $1 limit 1;`;
};
queries.updateItemById = function(idtask) {
  return `UPDATE ${idtask} SET "time"=$1, value=($2::JSONB) WHERE key=$3;`;
};
queries.selectItemtoUpdate = function(idtask) {
  return `SELECT key, "time", value FROM ${idtask} WHERE key = $1;`;
};
queries.selectAllItems = function(idtask) {
  return `SELECT value FROM ${idtask};`;
};

module.exports = queries;
