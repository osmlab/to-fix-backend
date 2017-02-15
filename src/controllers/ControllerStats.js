'use strict';
var boom = require('boom');
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

/* eslint-disable camelcase */
module.exports.listTasksActivity = function(request, reply) {
  var idtask = request.params.idtask;
  var timestamp = Math.round((new Date()).getTime());
  var size = 100;
  client.count({
    index: config.index,
    type: idtask + '_stats'
  }, function(error, resp) {
    if (resp.count < size) {
      size = resp.count;
    }
    client.search({
      index: config.index,
      type: idtask + '_stats',
      body: {
        query: {
          constant_score: {
            filter: {
              range: {
                time: {
                  gte: 0,
                  lt: timestamp
                }
              }
            }
          }
        },
        size: size,
        sort: [{
          time: {
            order: 'desc'
          }
        }]
      }
    }, function(err, resp) {
      if (err) return reply(boom.badRequest(err));
      /*eslint-disable array-callback-return*/
      var lastActivity = resp.hits.hits.map(function(act) {
        return act._source;
      });
      return reply({
        updated: timestamp,
        data: lastActivity
      });
    });
  });
};

module.exports.trackStats = function(request, reply) {
  var idtask = request.params.idtask;
  var timestamp = Math.round((new Date()).getTime());
  var from = Math.round(+new Date(request.params.from.split(':')[1]) / 1000);
  var to = Math.round(+new Date(request.params.to.split(':')[1]) / 1000) + 24 * 60 * 60;
  if (from === to) to = to + 86400;
  client.search({
    index: config.index,
    type: idtask + '_trackstats',
    body: {
      query: {
        constant_score: {
          filter: {
            range: {
              start: {
                gte: from,
                lt: to
              }
            }
          }
        }
      }
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    var stats = [];
    resp.hits.hits.forEach(function(obj) {
      obj = obj._source;
      stats.push(obj);
    });
    reply({
      updated: timestamp,
      stats: stats
    });
  });
};
