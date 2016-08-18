'use strict';
var boom = require('boom');
var config = require('./../configs/config');
var queries = require('./../queries/queries');
var childProcess = require('child_process');
var async = require('async');

var updateActivity = function(request, reply, now) {
  var client = request.pg.client;
  var idtask = request.params.idtask;
  var data = request.payload;
  var action = {
    key: data.idstr,
    action: data.action,
    editor: data.editor,
    user: data.user
  };
  client.query(queries.insertActivity(idtask), [now, action], function(err, result) {
    if (err) console.log(err);
    console.log('Update activity');
  });
};


var updateTask = function(request, reply) {
  var client = request.pg.client;
  var idtask = request.params.idtask;
  var data = request.payload;
  client.query(queries.selectATask(), [idtask], function(err, result) {
    if (err) return reply(boom.badRequest(err));
    var task = result.rows[0];
    task.body.stats[task.body.stats.length - 1][data.action] = task.body.stats[task.body.stats.length - 1][data.action] + 1;
    client.query(queries.updateATask(), [JSON.stringify(task.body), idtask], function(err, result) {
      if (err) console.log(err);
      console.log('Update tasks stats');
    });
  });
};

var updateItemEdit = function(request, reply, item, now, done) {
  var client = request.pg.client;
  var idtask = request.params.idtask;
  var data = request.payload;
  if (item.body.properties.tofix) {
    item.body.properties.tofix.push({
      action: data.action,
      user: data.user,
      time: now,
      editor: data.editor
    });
  } else {
    item.body.properties.tofix = [{
      action: 'edit',
      user: data.user,
      time: now,
      editor: data.editor
    }];
  }
  client.query(queries.updateItemById(idtask), [now + config.lockPeriod, JSON.stringify(item.body), item.id], function(err, result) {
    if (err) return reply(boom.badRequest(err));
    done();
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
    data.action = 'edit';
    data.idstr = item.idstr;
    updateItemEdit(request, reply, item, now, function() {
      updateTask(request, reply);
      updateActivity(request, reply, now);
    });
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

module.exports.Activity = function(request, reply) {
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

module.exports.updateItem = function(request, reply) {
  var client = request.pg.client;
  var iditem = request.params.iditem;
  var idtask = request.params.idtask;
  var data = request.payload;
  var now = Math.round((new Date()).getTime() / 1000);
  client.query(queries.selectItemtoUpdate(idtask), [iditem], function(err, result) {
    if (err) return reply(boom.badRequest(err));
    var item = result.rows[0];

    item.body.properties.tofix.push({
      action: data.action,
      user: data.user,
      time: now,
      editor: data.editor
    });

    var maxnum = config.maxnum;
    if (data.action === 'skip') {
      maxnum = now + config.lockPeriod;
    }

    client.query(queries.updateItemById(idtask), [maxnum, JSON.stringify(item.body), item.id], function(err, result) {
      if (err) return reply(boom.badRequest(err));
      reply({
        update: 'ok',
        iditem: iditem
      });
      updateTask(request, reply);
      updateActivity(request, reply, now);
    });
  });
};
