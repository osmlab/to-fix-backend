'use strict';
var Hapi = require('hapi');
var Inert = require('inert');
var Lout = require('lout');
var Vision = require('vision');
var Good = require('good');
var yar = require('yar');
var Grant = require('grant-hapi');
var grant = new Grant();
var hajwt2 = require('hapi-auth-jwt2');
var configServer = require('./src/configs/config.json');
var config = require('./src/configs/config');
var Routes = require('./src/routes');
var validate = require('./src/utils/validate').validate;

var server = new Hapi.Server();
server.connection({
  port: config.Port,
  routes: {
    cors: true
  }
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
          log: ['error']
        }]
      }, {
        module: 'good-console'
      }, 'stdout']
    }
  }
};

var session = {
  register: yar,
  options: {
    maxCookieSize: 0,
    cache: {
      expiresIn: 24 * 60 * 60 * 1000
    },
    cookieOptions: {
      password: config.sessionPassword,
      isSecure: false //process.env.NODE_ENV !== 'development'
    }
  }
};

var authConfig = {
  register: grant,
  options: configServer[config.NODE_ENV]
};

server.register([Vision, Inert, loutRegister, good, authConfig, session, hajwt2], function(err) {
  if (err) console.error('Failed loading plugins');
  server.auth.strategy('jwt', 'jwt', {
    key: config.JWT,
    validateFunc: validate,
    verifyOptions: {
      algorithms: ['HS256']
    }
  });
  server.start(function() {
    console.log(`Server running at: ${server.info.uri}`);
  });
});

server.route(Routes);
module.exports = server;
