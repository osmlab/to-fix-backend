'use strict';

const server = require('./lib/server');
const logDriver = require('./lib/log-driver')('index');

process.on('uncaughtException', function(err) {
  logDriver.error(err, { exportLog: true, event: 'crash' });
  process.exit(1);
});

const port = process.env.PORT || 8889;
server.listen(port, function(err) {
  if (err) throw err;
  logDriver.info('listing on port: ' + port);
});
