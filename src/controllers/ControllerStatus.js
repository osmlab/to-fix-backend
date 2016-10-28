'use strict';
var os = require('os');
var AWS = require('aws-sdk');
var elasticsearch = require('elasticsearch');
var AwsEsConnector = require('http-aws-es');
var config = require('./../configs/config');

var creds = new AWS.ECSCredentials();
creds.get();
var client;
creds.refresh(function(err) {
  if (err) throw err;
  var amazonES = {
    region: config.region,
    credentials: creds
  };
  client = new elasticsearch.Client({
    host: process.env.ElasticHost,
    log: 'trace',
    connectionClass: AwsEsConnector,
    amazonES: amazonES
  });
});

module.exports.status = function(request, reply) {
  client.cluster.health({}, function(err, response) {
    if (err) {
      reply(err);
    } else {
      reply({
        status: 'a ok',
        database: response,
        server: os.platform()
      });
    }
  });
};
