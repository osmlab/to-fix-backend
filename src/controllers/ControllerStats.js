'use strict';
var boom = require('boom');
var _ = require('lodash');
var AWS = require('aws-sdk');
var elasticsearch = require('elasticsearch');
var AwsEsConnector = require('http-aws-es');
var config = require('./../configs/config');
var localClient = require('./../utils/connection');

var client;
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  var creds = new AWS.ECSCredentials();
  creds.get();
  creds.refresh(function(err) {
    if (err) throw err;
    var amazonES = {
      region: config.region,
      credentials: creds
    };
    client = new elasticsearch.Client({
      host: process.env.ElasticHost,
      connectionClass: AwsEsConnector,
      amazonES: amazonES
    });
  });
} else {
  client = localClient.connect();
}

/* eslint-disable camelcase */
module.exports.listTasksActivity = function(request, reply) {
  var idtask = request.params.idtask;
  var timestamp = Math.round((new Date()).getTime());
  var from = Math.round(+new Date(request.params.from.split(':')[1]) / 1000);
  var to = Math.round(+new Date(request.params.to.split(':')[1]) / 1000) + 24 * 60 * 60;
  if (from === to) to = to + 86400;
  client.search({
    index: config.index,
    type: idtask + '_stats',
    body: {
      query: {
        match_all: {}
      },
      size: 200,
      sort: [{
        _timestamp: {
          order: 'desc'
        }
      }]
    }
  }, function(error, response) {
    /*eslint-disable array-callback-return*/
    var lastActivity = response.hits.hits.map(function(act) {
      if (act._source.time >= from && act._source.time <= to) {
        return act._source;
      }
    });
    return reply({
      updated: timestamp,
      data: lastActivity
    });
  });
};
/* eslint-enable camelcase */

module.exports.listTasksActivityByUser = function(request, reply) {
  var idtask = request.params.idtask;
  var user = request.params.user;
  var timestamp = Math.round((new Date()).getTime());
  var from = Math.round(+new Date(request.params.from.split(':')[1]) / 1000);
  var to = Math.round(+new Date(request.params.to.split(':')[1]) / 1000) + 24 * 60 * 60;
  if (from === to) to = to + 86400;
  var numItems = 0;
  var activity = [];
  client.search({
    index: config.index,
    type: idtask + '_stats',
    scroll: '2s'
  }, function getMore(err, resp) {
    if (err) return reply(boom.badRequest(err));
    resp.hits.hits.forEach(function(v) {
      v = v._source;
      if (v.time >= from && v.time <= to && v.user === user) {
        activity.push(v);
      }
      numItems++;
    });
    if (resp.hits.total !== numItems) {
      client.scroll({
        scrollId: resp._scroll_id,
        scroll: '2s'
      }, getMore);
    } else {
      return reply({
        updated: timestamp,
        data: activity
      });
    }
  });
};

module.exports.trackStats = function(request, reply) {
  var idtask = request.params.idtask;
  var timestamp = Math.round((new Date()).getTime());
  var from = Math.round(+new Date(request.params.from.split(':')[1]) / 1000);
  var to = Math.round(+new Date(request.params.to.split(':')[1]) / 1000) + 24 * 60 * 60;
  if (from === to) to = to + 86400;
  var dataUsers = {};
  var dataDate = [];
  var numItems = 0;
  client.search({
    index: config.index,
    type: idtask + '_trackstats',
    scroll: '2s'
  }, function getMore(err, resp) {
    if (err) return reply(boom.badRequest(err));
    resp.hits.hits.forEach(function(obj) {
      obj = obj._source;
      if (obj.start >= from && obj.start <= to) {
        var statsDay = {
          start: obj.start,
          edit: obj.edit,
          skip: obj.skip,
          fixed: obj.fixed,
          noterror: obj.noterror
        };
        dataDate.push(statsDay);
        _.each(obj, function(val, key) {
          if (_.isObject(val)) {
            val.user = key;
            if (!dataUsers[key]) {
              dataUsers[key] = val;
            } else {
              var user = dataUsers[key];
              _.each(val, function(v, k) {
                if (!_.isString(v)) {
                  if (user[k]) {
                    user[k] = user[k] + v;
                  } else {
                    user[k] = v;
                  }
                }
              });
            }
          }
        });
      }
      numItems++;
    });

    if (resp.hits.total !== numItems) {
      client.scroll({
        scrollId: resp._scroll_id,
        scroll: '2s'
      }, getMore);
    } else {
      reply({
        updated: timestamp,
        statsUsers: _.values(dataUsers),
        statsDate: dataDate
      });
    }
  });
};
