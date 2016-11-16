'use strict';
//This configuration is used to testing locally or for ElasticSearch endpoint which is open.
var elasticsearch = require('elasticsearch');
module.exports = {
  connect: function() {
    var client = new elasticsearch.Client({
      host: process.env.ElasticHost || 'localhost:9200',
      log: 'trace'
    });
    return client;
  }
};
