'use strict';
var Hapi = require('hapi');
var Inert = require('inert');
var Lout = require('lout');
var Vision = require('vision');
var HapiNodPostgres = require('hapi-node-postgres');
var Good = require('good');
var routes = require('./src/routes');
var config = require('./src/configs/config');

var server = new Hapi.Server();
server.connection({
  host: 'localhost',
  port: 3000
});
var loutRegister = {
  register: Lout,
  options: {
    endpoint: '/docs'
  }
};
var pgconnection = {
  register: HapiNodPostgres,
  options: {
    connectionString: config.connectionString,
    native: true
  }
};
var good = {
  register: Good,
  options: {
    reporters: {
      console: [{
        module: 'good-squeeze',
        name: 'Squeeze',
        args: [{
          response: '*',
          log: '*' //['error']
        }]
      }, {
        module: 'good-console'
      }, 'stdout']
    }
  }
};
server.register([Vision, Inert, loutRegister, pgconnection, good], function(err) {
  if (err) {
    console.error('Failed loading plugins');
  }
  server.route(routes);
  server.start(function() {
    console.log(`Server running at: ${server.info.uri}`);
  });
});

module.exports = server;
