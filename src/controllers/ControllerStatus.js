'use strict';
var boom = require('boom');
var os = require('os');
var pg = require('pg');
var config = require('./../configs/config');
var queries = require('./../queries/queries');

module.exports.status = function(request, reply) {
  pg.connect(config.connectionString, function(err, c, d) {
    if (err) {
      reply('error').code(500);
    } else {
      c.query(queries.dbVersion(), function(err, result) {
        if (err) return reply(boom.badRequest(err));
        reply({
          status: 'a ok',
          database: result.rows[0].version,
          server: os.platform()
        });
        c.end();
      });
    }
  });
};
