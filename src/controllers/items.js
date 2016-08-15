'use strict';
var boom = require('boom');
var config = require('./../configs/config');
var queries = require('./../queries/queries');

var updateTask = function(request, reply) {
  var client = request.pg.client;
  var idtask = request.params.idtask;
  var data = request.payload;
  client.query(queries.selectATask(), [idtask], function(err, result) {
    if (err) return reply(boom.badRequest(err));
    var task = result.rows[0];
    if (data.action) {
      task.body.stats[task.body.stats.length - 1][data.action] = task.body.stats[task.body.stats.length - 1][data.action] + 1;
    } else {
      task.body.stats[task.body.stats.length - 1]['edit'] = task.body.stats[task.body.stats.length - 1]['edit'] + 1;
    }
    client.query(queries.updateATask(), [JSON.stringify(task.body), idtask], function(err, result) {
      if (err) console.log(err);
    });
  });
};

var updateItem = function(request, reply) {
  var client = request.pg.client;
  var idtask = request.params.idtask;
  var data = request.payload;
  //need to improve here to update in only one query-- build a fuction
  client.query(queries.selectItemtoUpdate(idtask), [data.iditem], function(err, result) {
    if (err) return reply(boom.badRequest(err));
    var item = result.rows[0];
    item.body.properties.tofix.push({
      action: data.action,
      user: data.user
    });
    client.query(queries.updateItemById(idtask), [config.maxnum, JSON.stringify(item.body), item.id], function(err, result) {
      if (err) return reply(boom.badRequest(err));
    });
  });
};

module.exports.getItem = function(request, reply) {
  var client = request.pg.client;
  var now = Math.round((new Date()).getTime() / 1000);
  var idtask = request.params.idtask;
  var data = request.payload;
  client.query(queries.selectItem(idtask), [now], function(err, result) {
    if (err) return reply(boom.badRequest(err));
    if (result.rows.length === 0) {
      return reply({
        message: 'data gone' //improve the response when all data is gone
      });
    }
    var item = result.rows[0];
    reply(item);
    if (item.body.properties.tofix) {
      item.body.properties.tofix.push({
        action: 'edit',
        user: data.user
      });
    } else {
      item.body.properties.tofix = [{
        action: 'edit',
        user: data.user
      }];
    }
    client.query(queries.updateItemById(idtask), [now + config.lockPeriod, JSON.stringify(item.body), item.id], function(err, result) {
      if (err) return reply(boom.badRequest(err));
    });
    //to update fixed and notanerror action
    if (data.iditem && data.action) {
      updateItem(request, reply);
    }
    updateTask(request, reply);
  });
};

module.exports.getItemById = function(request, reply) {
  var client = request.pg.client;
  var iditem = request.params.iditem;
  var idtask = request.params.idtask;
  client.query(queries.selectItemById(idtask), [iditem], function(err, result) {
    if (err) return reply(boom.badRequest(err));
    return reply(result.rows[0]);
  });
};

module.exports.getAllItems = function(request, reply) {
  var client = request.pg.client;
  var idtask = request.params.idtask;
  client.query(queries.selectAllItems(idtask), function(err, result) {
    if (err) return reply(boom.badRequest(err));
    return reply({
      type: 'FeatureCollection',
      features: result.rows
    });
  });
};
