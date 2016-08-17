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
  return `CREATE TABLE ${idtask}_stats(id serial PRIMARY KEY, osmuser varchar(100) UNIQUE, "time" integer, body jsonb);`;
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
  // return `insert into ${idtask}_stats as act (osmuser,"time", body) VALUES ($1,$2 ,$3) on conflict (osmuser) do update set "time"=$2, body = jsonb_set(act.body, '{activity, 999999999}', $4, true) where act.osmuser = $1;`;
  return `with upsert as (
  update ${idtask}_stats set "time"=$2, body = jsonb_set(body, '{activity, 999999999}', $4, true) where osmuser = $1
  returning *
)
insert into ${idtask}_stats (osmuser, "time",body) 
select $1,$2 ,$3
where not exists (select 1 from ${idtask}_stats  where osmuser = $1);`;
};

module.exports = queries;
