'use strict';
// var elasticsearch = require('elasticsearch');
// var client = new elasticsearch.Client({
//   host: process.env.ElasticHost || 'localhost:9200',
//   log: 'trace'
// });
// module.exports = client;

var elasticsearch = require('elasticsearch');
var AwsEsConnector = require('http-aws-es');
var amazonES = {
  region: 'us-east-1',
  accessKey: process.env.AWS_ACCESS_KEY_ID,
  secretKey: process.env.AWS_SECRET_ACCESS_KEY
};
var client = new elasticsearch.Client({
  hosts: process.env.ElasticHost || 'localhost:9200',
  log: 'trace',
  connectionClass: AwsEsConnector,
  amazonES: amazonES
});

module.exports = client;