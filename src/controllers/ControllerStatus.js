'use strict';
var os = require('os');
var client = require('./../utils/connection.js');
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