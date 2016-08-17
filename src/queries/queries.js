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
queries.createTableStats = function(idtask) {
  return `CREATE TABLE ${idtask}_stats(id serial PRIMARY KEY, "user" varchar(100) UNIQUE, "time" integer, body jsonb);`;
};
queries.selectItemtoUpdate = function(idtask) {
  return `SELECT id, idstr, "time", body FROM ${idtask} WHERE idstr = $1;`;
};
queries.selectAllItems = function(idtask) {
  return `SELECT body  FROM ${idtask};`;
};
queries.selectATask = function() {
  return 'SELECT body FROM tasks where idstr=$1';
};
queries.updateATask = function() {
  return 'UPDATE tasks SET body=($1::JSONB) WHERE idstr=$2;';
};
queries.upsetActivity = function(idtask) {
  return `with upsert as (
          update ${idtask}_stats set "time"=$2, body = jsonb_set(body, '{activity, 999999999}', $4, true) where "user" = $1
          returning * )
          insert into ${idtask}_stats ("user", "time",body) 
          select $1,$2 ,$3
          where not exists (select 1 from ${idtask}_stats  where "user" = $1);`;
};

queries.selectActivity = function(idtask) {
  return `SELECT activity.user,activity.editor,activity.action,activity.date
          from ( SELECT "user",
          cast(jsonb_array_elements(body->'activity') ->>'editor' as text) as editor, 
          cast(jsonb_array_elements(body->'activity') ->>'action' as text)as action, 
          cast(jsonb_array_elements(body->'activity') ->>'date' as int) as date FROM ${idtask}_stats )
          activity WHERE activity.date>$1;`;
};

queries.selectActivityByUser = function(idtask) {
  return `SELECT id,"user","time",body->'activity' as activity FROM ${idtask}_stats WHERE "user"=$1`;
};

module.exports = queries;
