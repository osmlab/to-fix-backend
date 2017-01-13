'use strict';
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

module.exports.validate = function(decoded, request, callback) {
  client.get({
    index: config.index,
    type: 'users',
    id: decoded.id
  }, function(err, resp) {
    if (err) {
      return callback(err, false);
    } else {
      var osmUser = resp._source;
      if (osmUser.user === decoded.user && osmUser.idsession === decoded.idsession) {
        return callback(null, true);
      } else {
        return callback(null, false);
      }
    }
  });
};
