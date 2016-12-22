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

module.exports.listTasksActivity = function(request, reply) {
  var idtask = request.params.idtask;
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
      if (v.time >= from && v.time <= to) {
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
  var dataDate = {};
  var numItems = 0;
  client.search({
    index: config.index,
    type: idtask + '_stats',
    scroll: '2s'
  }, function getMore(err, resp) {
    if (err) return reply(boom.badRequest(err));
    resp.hits.hits.forEach(function(v) {
      v = v._source;
      if (v.time >= from && v.time <= to) {
        //Filter dataUsers per user
        if (!dataUsers[v.user]) {
          dataUsers[v.user] = {
            edit: 0,
            fixed: 0,
            noterror: 0,
            skip: 0,
            user: v.user
          };
          dataUsers[v.user][v.action] = dataUsers[v.user][v.action] + 1;
        } else {
          dataUsers[v.user][v.action] = dataUsers[v.user][v.action] + 1;
        }
        //Filter data per date, basically for each day
        var d = new Date(v.time * 1000);
        //Need to improve this, for now is ok
        var day = getTimestamp((d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear() + ' 00:00:00');
        if (!dataDate[day]) {
          dataDate[day] = {
            edit: 0,
            fixed: 0,
            noterror: 0,
            skip: 0,
            start: day
          };
          dataDate[day][v.action] = dataDate[day][v.action] + 1;
        } else {
          dataDate[day][v.action] = dataDate[day][v.action] + 1;
        }
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
        statsDate: _.values(dataDate)
      });
    }
  });
};

function getTimestamp(strDate) {
  var datum = Date.parse(strDate);
  return datum / 1000;
}
