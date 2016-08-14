'use strict';

const massive = require("massive");
const boom = require('boom');
const config = require('./../configs/config');
const queries = require('./../queries/queries');

module.exports.getItem = function(request, reply) {
  const client = request.pg.client;
  const now = Math.round((new Date()).getTime() / 1000);
  const idtask = request.params.idtask;
  const data = request.payload;
  client.query(queries.selectItem(idtask), [now], (err, result) => {
    if (err) return reply(boom.badRequest(err));
    if (result.rows.length === 0) {
      return reply({
        message: 'data gone' //improve the response when all data is gone
      });
    }
    let item = result.rows[0];
    reply(item);
    item.body.properties.tofix = [{
      action: 'edit',
      user: data.user
    }];
    client.query(queries.updateItemById(idtask), [now + config.lockPeriod, JSON.stringify(item.body), item.id], (err, result) => {
      console.log(result);
    });
    if (data.iditem && data.action) {
      updateItem(request, reply);
    }
  });
};

module.exports.getItemById = function(request, reply) {
  const client = request.pg.client;
  const iditem = request.params.iditem;
  const idtask = request.params.idtask;
  client.query(queries.selectItemById(idtask), [iditem], (err, result) => {
    if (err) return reply(boom.badRequest(err));
    return reply(result.rows[0]);
  });
};

module.exports.getAllItems = function(request, reply) {
  const client = request.pg.client;
  const idtask = request.params.idtask;

  client.query(queries.selectAllItems(idtask), (err, result) => {
    if (err) return reply(boom.badRequest(err));
    return reply({
      "type": "FeatureCollection",
      "features": result.rows
    });
  });
}

const updateItem = function(request, reply) {
  const client = request.pg.client;
  const idtask = request.params.idtask;
  const data = request.payload;
  //need to improve here to update in only one query-- build a fuction
  client.query(queries.selectItemtoUpdate(idtask), [data.iditem], (err, result) => {
    if (err) return reply(boom.badRequest(err));
    let item = result.rows[0];
    item.body.properties.tofix.push({
      action: data.action,
      user: data.user
    });
    client.query(queries.updateItemById(idtask), [config.maxnum, JSON.stringify(item.body), item.id], (err, result) => {
      console.log(result);
    });
  });
};