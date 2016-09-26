'use strict';
var Hapi = require('hapi');
var Inert = require('inert');
var Lout = require('lout');
var Vision = require('vision');
var Good = require('good');
var Routes = require('./src/routes');

var server = new Hapi.Server();
server.connection({
  port: 8000
});
var loutRegister = {
  register: Lout,
  options: {
    endpoint: '/docs'
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

server.register([Vision, Inert, loutRegister, good], function(err) {
  if (err) {
    console.error('Failed loading plugins');
  }
  server.route(Routes);
  server.start(function() {
    console.log(`Server running at: ${server.info.uri}`);
  });
});

module.exports = server;
