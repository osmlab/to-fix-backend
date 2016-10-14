'use strict';
var boom = require('boom');
var _ = require('lodash');
var config = require('./../configs/config');
var client = require('./../utils/connection.js');

var updateActivity = function(request, reply, item, now) {
  var idtask = request.params.idtask;
  var data = request.payload;
  var action = {};
  if (item instanceof Array) {
    var activityToInsert = [];
    for (var i = 0; i < item.length; i++) {
      action = {
        time: now,
        key: item[i].properties._key,
        action: data.action,
        editor: data.editor,
        user: data.user
      };
      activityToInsert.push({
        index: {
          _index: 'tofix',
          _type: idtask + '_stats',
          _id: item[i].properties._key
        }
      }, action);
    }
    client.bulk({
      body: activityToInsert
    }, function(err) {
      if (err) console.log(err);
    });
  } else {
    action = {
      time: now,
      key: item.properties._key,
      action: data.action,
      editor: data.editor,
      user: data.user
    };
    client.create({
      index: 'tofix',
      type: idtask + '_stats',
      body: action
    }, function(err) {
      if (err) console.log(err);
    });
  }
};

var updateStatsInTask = function(request, reply, numitems) {
  var idtask = request.params.idtask;
  var data = request.payload;
  client.get({
    index: 'tofix',
    type: 'tasks',
    id: idtask
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    var task = resp._source;
    task.value.stats[task.value.stats.length - 1][data.action] = task.value.stats[task.value.stats.length - 1][data.action] + numitems;
    client.update({
      index: 'tofix',
      type: 'tasks',
      id: task.idtask,
      body: {
        doc: {
          value: task.value
        }
      }
    }, function(err) {
      if (err) console.log(err);
    });
  });
};

var updateItemEdit = function(request, reply, item, now, done) {
  var idtask = request.params.idtask;
  var data = request.payload;
  if (item instanceof Array) {
    //this is when requequest for many items
    var itemsToUpdate = [];
    for (var i = 0; i < item.length; i++) {
      if (item[i].properties._tofix) {
        item[i].properties._tofix.push({
          action: data.action,
          user: data.user,
          time: now,
          editor: data.editor
        });
      } else {
        item[i].properties._tofix = [{
          action: data.action,
          user: data.user,
          time: now,
          editor: data.editor
        }];
      }
      item[i].properties._time = now + config.lockPeriodGroup;
      itemsToUpdate.push({
        update: {
          _index: 'tofix',
          _type: idtask,
          _id: item[i].properties._key
        }
      }, {
        doc: {
          properties: item[i].properties
        }
      });
    }
    client.bulk({
      body: itemsToUpdate
    }, done);
  } else { // to update a item
    if (item.properties._tofix) {
      item.properties._tofix.push({
        action: data.action,
        user: data.user,
        time: now,
        editor: data.editor
      });
    } else {
      item.properties._tofix = [{
        action: data.action,
        user: data.user,
        time: now,
        editor: data.editor
      }];
    }
    item.properties._time = now + config.lockPeriod;
    client.update({
      index: 'tofix',
      type: idtask,
      id: item.properties._key,
      body: {
        doc: {
          properties: item.properties
        }
      }
    }, done);
  }
};

module.exports.getAItem = function(request, reply) {
  var now = Math.round((new Date()).getTime() / 1000);
  var idtask = request.params.idtask;
  client.search({
    index: 'tofix',
    type: idtask,
    body: {
      size: 1,
      filter: {
        bool: {
          must: [{
            range: {
              'properties._time': {
                lt: now,
                gte: 0
              }
            }
          }]
        }
      }
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    if (resp.hits.hits.length === 0) {
      reply(boom.resourceGone(config.messages.dataGone));
      setTaskAsCompleted(idtask);
    } else {
      var item = resp.hits.hits[0]._source;
      reply(item);
      //we know all new request is for edition
      request.payload.action = 'edit';
      updateItemEdit(request, reply, item, now, function(err) {
        if (err) console.log(err);
        updateStatsInTask(request, reply, 1);
        updateActivity(request, reply, item, now);
      });
    }
  });
};

module.exports.getGroupItems = function(request, reply) {
  var now = Math.round((new Date()).getTime() / 1000);
  var idtask = request.params.idtask;
  var numitems = request.params.numitems;
  client.search({
    index: 'tofix',
    type: idtask,
    body: {
      size: numitems,
      filter: {
        bool: {
          must: [{
            range: {
              'properties._time': {
                lt: now,
                gte: 0
              }
            }
          }]
        }
      }
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    if (resp.hits.hits.length === 0) {
      reply(boom.resourceGone(config.messages.dataGone));
      setTaskAsCompleted(idtask);
    } else {
      var items = resp.hits.hits.map(function(v) {
        return v._source;
      });
      reply(items);
      // we know all new request is for edition
      request.payload.action = 'edit';
      updateItemEdit(request, reply, items, now, function(err) {
        if (err) console.log(err);
        updateStatsInTask(request, reply, numitems);
        updateActivity(request, reply, items, now);
      });
    }
  });
};

module.exports.getItemById = function(request, reply) {
  var key = request.params.key;
  var idtask = request.params.idtask;
  client.get({
    index: 'tofix',
    type: idtask,
    id: key
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    reply(resp._source);
  });
};

module.exports.updateItem = function(request, reply) {
  var idtask = request.params.idtask;
  var data = request.payload;
  var key = data.key;
  var now = Math.round((new Date()).getTime() / 1000);
  client.get({
    index: 'tofix',
    type: idtask,
    id: key
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    var item = resp._source;
    item.properties._tofix.push({
      action: data.action,
      user: data.user,
      time: now,
      editor: data.editor
    });
    var maxNum = config.maxNum;
    if (data.action === 'skip') {
      maxNum = now + config.lockPeriod;
    }
    item.properties._time = maxNum;
    client.update({
      index: 'tofix',
      type: idtask,
      id: key,
      body: {
        doc: {
          properties: item.properties
        }
      }
    }, function(err, resp) {
      if (err) return reply(boom.badRequest(err));
      reply({
        index: resp._index,
        type: resp._type,
        key: resp._id,
        status: 'updated'
      });
      updateStatsInTask(request, reply, 1);
      updateActivity(request, reply, item, now);
    });
  });
};

//remove later this function
module.exports.getAllItems = function(request, reply) {
  var idtask = request.params.idtask;
  client.search({
    index: 'tofix',
    type: idtask,
    body: {
      size: 1000, //get item using pagination - need to fix here
      query: {
        match_all: {}
      }
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    var items = resp.hits.hits.map(function(v) {
      return v._source;
    });
    return reply(items);
  });
};

module.exports.getAllItemsByAction = function(request, reply) {
  var idtask = request.params.idtask;
  var action = request.params.action;
  var numItems = 0;
  var ItemsByAction = [];
  client.search({
    index: 'tofix',
    type: idtask,
    scroll: '3s'
  }, function getMore(err, resp) {
    if (err) return reply(boom.badRequest(err));
    resp.hits.hits.forEach(function(v) {
      if (v._source.properties._tofix && v._source.properties._tofix[v._source.properties._tofix.length - 1].action === action) {
        ItemsByAction.push(v._source);
      }
      numItems++;
    });
    if (resp.hits.total !== numItems) {
      client.scroll({
        scrollId: resp._scroll_id,
        scroll: '3s'
      }, getMore);
    } else {
      return reply(ItemsByAction);
    }
  });
};

module.exports.UnlockedItems = function(request, reply) {
  var idtask = request.params.idtask;
  var groupIds = request.payload.groupIds.split(',');
  var now = Math.round((new Date()).getTime() / 1000);
  var itemsToUnlocked = [];
  client.mget({
    index: 'tofix',
    type: idtask,
    body: {
      ids: groupIds
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    resp.docs.forEach(function(val) {
      var keyItem = val._source.properties._key;
      var lastAction = val._source.properties._tofix[val._source.properties._tofix.length - 1].action;
      if (lastAction === 'fixed' || lastAction === 'noterror') {
        groupIds = _.pull(groupIds, keyItem);
      }
    });
    for (var i = 0; i < groupIds.length; i++) {
      itemsToUnlocked.push({
        update: {
          _index: 'tofix',
          _type: idtask,
          _id: groupIds[i]
        }
      }, {
        doc: {
          'properties': {
            _time: now
          }
        }
      });
    }
    client.bulk({
      body: itemsToUnlocked
    }, function(err) {
      if (err) return reply(boom.badRequest(err));
      return reply({
        status: 'unlocked',
        groupIds: groupIds
      });
    });
  });
};

function setTaskAsCompleted(idtask) {
  client.get({
    index: 'tofix',
    type: 'tasks',
    id: idtask
  }, function(err, resp) {
    if (err) console.log(err);
    var task = resp._source;
    console.log(task);
    var stats = task.value.stats[task.value.stats.length - 1];
    if ((stats.fixed + stats.noterror) >= stats.items) {
      //task is completed
      task.isCompleted = true;
      client.update({
        index: 'tofix',
        type: 'tasks',
        id: idtask,
        body: {
          doc: {
            isCompleted: task.isCompleted
          }
        }
      }, function(err) {
        if (err) console.log(err);
      });
    }
  });
}
