'use strict'
const Hapi = require('hapi');
const Inert = require('inert');
const Lout = require('lout');
const Vision = require('vision');
const routes = require('./src/routes');
const config = require('./src/configs/config');

const server = new Hapi.Server();
server.connection({
  host: 'localhost',
  port: 3000
});

const loutRegister = {
  register: Lout,
  options: {
    endpoint: '/docs'
  }
};
const pgconnection = {
  register: require('hapi-node-postgres'),
  options: {
    connectionString: config.connectionString,
    native: true
  }
};

let good = {
  register: require('good'),
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

server.register([Vision, Inert, loutRegister, pgconnection, good], (err) => {
  if (err) {
    console.error(`Failed loading plugins`);
    process.exit(1);
  }
  server.route(routes);
  server.start(() => console.log(`Server running at: ${server.info.uri}`));
});

module.exports = server;