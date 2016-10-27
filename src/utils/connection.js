'use strict';
var AWS = require('aws-sdk');
var elasticsearch = require('elasticsearch');
var AwsEsConnector = require('http-aws-es');
var creds = new AWS.ECSCredentials();
creds.get();
var amazonES = {
  region: 'us-east-1',
  credentials: creds.refresh()
};
console.log(amazonES);
var client = new elasticsearch.Client({
  host: process.env.ElasticHost || 'localhost:9200',
  log: 'trace',
  connectionClass: AwsEsConnector,
  amazonES: amazonES
});
module.exports = client;