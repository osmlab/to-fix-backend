'use strict'

const queries = {};
queries.selectItem = (idtask) => `SELECT id, idstr, "time", body FROM ${idtask} WHERE "time" < $1 limit 1;`;
queries.selectItemById = (idtask) => `SELECT id, idstr, "time", body FROM ${idtask} WHERE idstr = $1 limit 1;`;
queries.updateItemById = (idtask) => `UPDATE ${idtask} SET "time"=$1, body=($2::JSONB) WHERE id=$3;`;
queries.createTable = (idtask) => `CREATE TABLE ${idtask}( id serial PRIMARY KEY, idstr varchar(50), time integer, body jsonb );`;
queries.selectItemtoUpdate = (idtask) => `SELECT id, idstr, "time", body FROM ${idtask} WHERE idstr = $1;`;
queries.selectAllItems = (idtask) => `SELECT body  FROM ${idtask};`;

module.exports = queries;