'use strict';

const server = require('./lib/server');
const logger = require('fastlog')('to-fix-backend');

process.on('uncaughtException', function(err) {
  logger.fatal(err);
  process.exit(1);
});

const port = process.env.PORT || 8889;
server.listen(port, function(err) {
  if (err) throw err;
  logger.info('listing on port: ' + port);
});
