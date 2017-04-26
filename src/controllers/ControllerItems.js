/* eslint-disable camelcase */

'use strict';
var boom = require('boom');
var _ = require('lodash');
var AWS = require('aws-sdk');
var elasticsearch = require('elasticsearch');
var AwsEsConnector = require('http-aws-es');
var config = require('./../configs/config');
var localClient = require('./../utils/connection');

var client;
if (config.envType) {
  var creds = new AWS.ECSCredentials();
  creds.get();
  creds.refresh(function(err) {
    if (err) throw err;
    var amazonES = {
      region: config.region,
      credentials: creds
    };
    client = new elasticsearch.Client({
      host: config.ElasticHost,
      connectionClass: AwsEsConnector,
      amazonES: amazonES
    });
  });
} else {
  client = localClient.connect();
}

module.exports.getAItem = function(request, reply) {
  var now = Math.round((new Date()).getTime() / 1000);
  var idtask = request.params.idtask;
  var type = idtask + request.params.type;
  request.payload.user = request.payload.user || 'anonymous';
  request.payload.editor = request.payload.editor || 'unknown';
  client.search({
    index: config.index,
    type: type,
    body: {
      size: 1,
      query: {
        function_score: {
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
          },
          functions: [{
            random_score: {
              seed: Math.random().toString()
            }
          }],
          score_mode: 'sum'
        }
      }
    }
  }, function(err, resp) {
    if (err) {
      console.log(err);
      return reply(boom.badRequest(err));
    } else if (resp.hits.hits.length === 0) {
      reply(boom.resourceGone(config.messages.dataGone));
      setTaskAsCompleted(idtask);
    } else {
      var item = resp.hits.hits[0]._source;
      request.payload.action = 'edit';
      updateItemEdit(request, reply, item, now, function(err) {
        if (err) return reply(boom.badRequest(err));
        reply(item);
        updateStatsInTask(request, reply, 1);
        updateActivity(request, reply, item, now);
        trackStats(request, 1);
      });
    }
  });
};

module.exports.getGroupItems = function(request, reply) {
  var now = Math.round((new Date()).getTime() / 1000);
  var idtask = request.params.idtask;
  var type = idtask + request.params.type;
  var numitems = request.params.numitems;
  request.payload.user = request.payload.user || 'anonymous';
  request.payload.editor = request.payload.editor || 'unknown';
  client.search({
    index: config.index,
    type: type,
    body: {
      size: numitems,
      query: {
        function_score: {
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
          },
          functions: [{
            random_score: {
              seed: Math.random().toString()
            }
          }],
          score_mode: 'sum'
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
      request.payload.action = 'edit';
      updateItemEdit(request, reply, items, now, function(err) {
        if (err) return reply(boom.badRequest(err));
        reply(items);
        updateStatsInTask(request, reply, numitems);
        updateActivity(request, reply, items, now);
        trackStats(request, numitems);
      });
    }
  });
};

module.exports.getItemById = function(request, reply) {
  var idtask = request.params.idtask;
  var type = idtask + request.params.type;
  var key = request.params.key;
  client.get({
    index: config.index,
    type: type,
    id: key
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    reply(resp._source);
  });
};

module.exports.updateItem = function(request, reply) {
  var idtask = request.params.idtask;
  var type = idtask + request.params.type;
  var data = request.payload;
  var key = data.key;
  var now = Math.round((new Date()).getTime() / 1000);
  //Optimize here
  client.get({
    index: config.index,
    type: type,
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
      maxNum = now;
    }
    item.properties._time = maxNum;
    client.update({
      index: config.index,
      type: type,
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
      saveNotErrorItems(request, item, now);
      trackStats(request, 1);
    });
  });
};

module.exports.getAllItems = function(request, reply) {
  var idtask = request.params.idtask;
  var type = idtask + request.params.type;
  var items = [];
  var numItems = 0;
  client.search({
    index: config.index,
    type: type,
    scroll: '15s'
  }, function getMore(err, resp) {
    if (err) return reply(boom.badRequest(err));
    resp.hits.hits.forEach(function(v) {
      items.push(v._source);
      numItems++;
    });
    if (resp.hits.total !== numItems) {
      client.scroll({
        scrollId: resp._scroll_id,
        scroll: '15s'
      }, getMore);
    } else {
      return reply(items);
    }
  });
};

module.exports.countItems = function(request, reply) {
  var idtask = request.params.idtask;
  var type = idtask + request.params.type;
  client.count({
    index: config.index,
    type: type
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    return reply({
      task: idtask,
      type: type,
      numitems: resp.count
    });
  });
};

module.exports.getNoterrorItemsId = function(request, reply) {
  var idtask = request.params.idtask;
  var numItems = 0;
  var noterrorItemsId = [];
  client.search({
    index: config.index,
    type: idtask + '_noterror',
    scroll: '10s'
  }, function getMore(err, resp) {
    if (err) return reply(boom.badRequest(err));
    resp.hits.hits.forEach(function(v) {
      noterrorItemsId.push(v._source.key);
      numItems++;
    });
    if (resp.hits.total !== numItems) {
      client.scroll({
        scrollId: resp._scroll_id,
        scroll: '10s'
      }, getMore);
    } else {
      return reply(noterrorItemsId);
    }
  });
};

module.exports.UnlockedItems = function(request, reply) {
  var idtask = request.params.idtask;
  var type = idtask + request.params.type;
  var groupIds = request.payload.groupIds.split(',');
  var now = Math.round((new Date()).getTime() / 1000);
  var itemsToUnlocked = [];
  client.mget({
    index: config.index,
    type: type,
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
          _index: config.index,
          _type: type,
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
    index: config.index,
    type: 'tasks',
    id: idtask
  }, function(err, resp) {
    if (err) console.log(err);
    var task = resp._source;
    var stats = task.value.stats[task.value.stats.length - 1];
    if ((stats.fixed + stats.noterror) >= stats.items) {
      //task is completed
      task.isCompleted = true;
      client.update({
        index: config.index,
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

function getTimestamp(date) {
  var strDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + ' 00:00:00';
  var datum = Date.parse(strDate);
  return datum / 1000;
}

function trackStats(request, numitems) {
  var idtask = request.params.idtask;
  var data = request.payload;
  var stats;
  var timestampDay = getTimestamp(new Date());
  client.get({
    index: config.index,
    type: idtask + '_trackstats',
    id: timestampDay
  }, function(err, resp) {
    if (err) console.log(err);
    if (resp.found) {
      //When  exist the stats
      stats = statsFormat(resp._source, data, timestampDay, numitems);
      client.update({
        index: config.index,
        type: idtask + '_trackstats',
        id: timestampDay,
        body: {
          doc: stats
        }
      }, function(err) {
        if (err) console.log(err);
      });

    } else {
      //When does not exist any stats
      stats = statsFormat(null, data, timestampDay, numitems);
      client.create({
        index: config.index,
        type: idtask + '_trackstats',
        id: timestampDay,
        body: stats
      }, function(err) {
        if (err) console.log(err);
      });
    }
  });
}

function statsFormat(stats, data, timestampDay, numitems) {
  if (stats) {
    stats[data.action] = stats[data.action] + numitems;
    if (!stats[data.user]) {
      stats[data.user] = {
        edit: 0,
        skip: 0,
        fixed: 0,
        noterror: 0
      };
    }
    if (!stats[data.user][data.editor]) {
      stats[data.user][data.editor] = 0;
    }
    stats[data.user][data.action] = stats[data.user][data.action] + numitems;
    stats[data.user][data.editor] = stats[data.user][data.editor] + numitems;
  } else {
    stats = {
      start: timestampDay,
      edit: 0,
      skip: 0,
      fixed: 0,
      noterror: 0
    };
    stats[data.user] = {
      edit: 0,
      skip: 0,
      fixed: 0,
      noterror: 0
    };
    stats[data.action] = stats[data.action] + numitems;
    stats[data.user][data.action] = stats[data.user][data.action] + numitems;
    stats[data.user][data.editor] = numitems;
  }
  return stats;
}

function updateActivity(request, reply, item, now) {
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
          _index: config.index,
          _type: idtask + '_activity'
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
      index: config.index,
      type: idtask + '_activity',
      body: action
    }, function(err) {
      if (err) console.log(err);
    });
  }
}

function saveNotErrorItems(request, item, now) {
  var idtask = request.params.idtask;
  var data = request.payload;
  if (data.action === 'noterror') {
    var action = {};
    action = {
      time: now,
      key: item.properties._key
    };
    client.create({
      index: config.index,
      type: idtask + '_noterror',
      id: item.properties._key,
      body: action
    }, function(err) {
      if (err) console.log(err);
    });
  }
}

function updateStatsInTask(request, reply, numitems) {
  var idtask = request.params.idtask;
  var data = request.payload;
  client.search({
    index: config.index,
    type: idtask + '_stats',
    body: {
      query: {
        match_all: {}
      },
      size: 1,
      sort: [{
        date: {
          order: 'desc'
        }
      }]
    }
  }, function(err, resp) {
    if (err) console.log(err);
    if (resp.hits && resp.hits.hits[0]) {
      var stats = resp.hits.hits[0]._source;
      var id = resp.hits.hits[0]._id;
      if ((stats.noterror + stats.fixed) < stats.items) {
        stats[data.action] = stats[data.action] + numitems;
        client.update({
          index: config.index,
          type: idtask + '_stats',
          id: id,
          body: {
            doc: stats
          }
        }, function(err) {
          if (err) console.log(err);
        });
      }
    }
  });
}

function updateItemEdit(request, reply, item, now, done) {
  var idtask = request.params.idtask;
  var type = idtask + request.params.type;
  var data = request.payload;
  if (item instanceof Array) {
    //This is when requequest for many items
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
          _index: config.index,
          _type: type,
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
      index: config.index,
      type: type,
      id: item.properties._key,
      body: {
        doc: {
          properties: item.properties
        }
      }
    }, done);
  }
}