'use strict';

const Hapi = require('hapi');
const Inert = require('inert');
const Lout = require('lout');
const Vision = require('vision');
const Routes = require('./routes');
const RoutesItem = require('./routes-item');
const config = require('./src/configs/config');
const server = new Hapi.Server({});
server.connection({
    port: 3000,
    host: '0.0.0.0'
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

server.register([Vision, Inert, loutRegister, pgconnection], function(err) {
    if (err) {
        console.error('Failed loading plugins');
        process.exit(1);
    }
    const allroutes = Routes.concat(RoutesItem);
    server.route(allroutes);
    server.start(function() {
        console.log('Server running at:', server.info.uri);
    });
});

module.exports = server;