'use strict';
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
module.exports = client;