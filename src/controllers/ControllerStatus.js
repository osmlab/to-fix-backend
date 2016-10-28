'use strict';
var os = require('os');
// var client = require('./../utils/connection.js');

var AWS = require('aws-sdk');
var elasticsearch = require('elasticsearch');
var AwsEsConnector = require('http-aws-es');
var creds = new AWS.ECSCredentials();
creds.get();
var client;
creds.refresh(function(err) {
  if (err) throw err;
  var amazonES = {
    region: 'us-east-1',
    credentials: creds
  };
  client = new elasticsearch.Client({
    host: process.env.ElasticHost || 'localhost:9200',
    log: 'trace',
    connectionClass: AwsEsConnector,
    amazonES: amazonES
  });
});

module.exports.status = function(request, reply) {
  // client.cluster.health({}, function(err, response) {
  //   if (err) {
  //     reply(err);
  //   } else {
  reply({
    status: 'a ok',
    // database: response,
    server: os.platform()
  });
  //   }
  // });
};