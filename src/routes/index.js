'use strict';
var items = require('./routesItems.js');
var tasks = require('./routesTasks.js');
var status = require('./routesStatus.js');
var stats = require('./routesStats.js');
var users = require('./routesUsers.js');
var settings = require('./routesSettings.js');

module.exports = [].concat(tasks, items, status, stats, users, settings);
