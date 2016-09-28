'use strict';
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: process.env.ElasticHost || 'localhost:9200',
  log: 'trace'
});
module.exports = client;
