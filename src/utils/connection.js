'use strict';
//This configuration is used to testing locally or for ElasticSearch endpoint which is open.
var elasticsearch = require('elasticsearch');
var config = require('./../configs/config');

module.exports = {
  connect: function() {
    var client = new elasticsearch.Client({
      host: config.ElasticHost,
      // log: 'trace'
    });
    return client;
  }
};
