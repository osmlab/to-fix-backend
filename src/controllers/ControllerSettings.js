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
module.exports.create = function(request, reply) {
  var data = request.payload;
  client.create({
    index: data.index,
    type: data.type,
    id: data.id,
    body: JSON.parse(data.obj)
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    reply(resp._source);
  });
};

module.exports.createstats = function(request, reply) {
  var data = request.payload;
  var arrobj = JSON.parse(data.obj).stats;
  var bulk = [];
  for (var i = 0; i < arrobj.length; i++) {
    var index = {
      index: {
        _index: data.index,
        _id: arrobj[i].start,
        _type: data.type
      }
    };
    var obj = arrobj[i];
    bulk.push(index, obj);
  }
  client.bulk({
    maxRetries: 5,
    index: data.index,
    id: data.id,
    type: data.type,
    body: bulk
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    reply(resp._source);
  });
};

module.exports.createnoterror = function(request, reply) {
  var data = request.payload;
  var arrobj = JSON.parse(data.obj);
  var bulk = [];
  for (var i = 0; i < arrobj.length; i++) {
    var index = {
      index: {
        _index: data.index,
        _id: arrobj[i],
        _type: data.type
      }
    };
    var obj = {
      time: Date.now(),
      key: arrobj[i]
    };
    bulk.push(index, obj);
  }

  client.bulk({
    maxRetries: 5,
    index: data.index,
    id: data.id,
    type: data.type,
    body: bulk
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    reply(resp._source);
  });
};

module.exports.update = function(request, reply) {
  var data = request.payload;
  client.update({
    index: data.index,
    type: data.type,
    id: data.id,
    body: {
      doc: JSON.parse(data.obj)
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    reply(resp._source);
  });
};
