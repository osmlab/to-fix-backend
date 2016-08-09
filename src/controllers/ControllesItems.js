'use strict';
var boom = require('boom');
var config = require('./../configs/config');
var queries = require('./../queries/queries');

var updateActivity = function(request, reply, now) {
  var client = request.pg.client;
  var idtask = request.params.idtask;
  var data = request.payload;
  var action = {
    key: data.key,
    action: data.action,
    editor: data.editor,
    user: data.user
  };
  client.query(queries.insertActivity(idtask), [now, action], function(err, result) {
    if (err) console.log(err);
    console.log('Update activity');
  });
};

var updateStatsInTask = function(request, reply) {
  var client = request.pg.client;
  var idtask = request.params.idtask;
  var data = request.payload;
  client.query(queries.selectTasksById(), [idtask], function(err, result) {
    if (err) return reply(boom.badRequest(err));
    var task = result.rows[0].value;
    task.value.stats[task.value.stats.length - 1][data.action] = task.value.stats[task.value.stats.length - 1][data.action] + 1;
    client.query(queries.updateATask(), [JSON.stringify(task), idtask], function(err, result) {
      if (err) console.log(err);
      console.log('Update tasks stats');
    });
  });
};

var updateItemEdit = function(request, reply, item, now, done) {
  var client = request.pg.client;
  var idtask = request.params.idtask;
  var data = request.payload;
  if (item.value.properties.tofix) {
    item.value.properties.tofix.push({
      action: data.action,
      user: data.user,
      time: now,
      editor: data.editor
    });
  } else {
    item.value.properties.tofix = [{
      action: 'edit',
      user: data.user,
      time: now,
      editor: data.editor
    }];
  }
  client.query(queries.updateItemById(idtask), [now + config.lockPeriod, JSON.stringify(item.value), item.key], function(err, result) {
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
        //improve the response when all data is gone
        message: 'data gone'
      });
    } else {
      var item = result.rows[0];
      reply(item);
      data.action = 'edit';
      data.key = item.key;
      updateItemEdit(request, reply, item, now, function() {
        updateStatsInTask(request, reply);
        updateActivity(request, reply, now);
      });
    }
  });
};

module.exports.getItemById = function(request, reply) {
  var client = request.pg.client;
  var key = request.params.key;
  var idtask = request.params.idtask;
  client.query(queries.selectItemById(idtask), [key], function(err, result) {
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
  var idtask = request.params.idtask;
  var data = request.payload;
  var key = data.key;
  var now = Math.round((new Date()).getTime() / 1000);
  client.query(queries.selectItemtoUpdate(idtask), [key], function(err, result) {
    if (err) return reply(boom.badRequest(err));
    var item = result.rows[0];
    item.value.properties.tofix.push({
      action: data.action,
      user: data.user,
      time: now,
      editor: data.editor
    });
    var maxNum = config.maxNum;
    if (data.action === 'skip') {
      maxNum = now + config.lockPeriod;
    }
    client.query(queries.updateItemById(idtask), [maxNum, JSON.stringify(item.value), item.key], function(err, result) {
      if (err) return reply(boom.badRequest(err));
      reply({
        update: 'ok',
        key: key
      });
      updateStatsInTask(request, reply);
      updateActivity(request, reply, now);
    });
  });
};
