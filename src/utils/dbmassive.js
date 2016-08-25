'use strict';
var massive = require('massive');
var config = require('./../configs/config');
module.exports = massive.connectSync({
  connectionString: config.connectionString
});
