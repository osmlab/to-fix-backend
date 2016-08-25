'use strict';
var items = require('./routes-items.js');
var projects = require('./routes-projects.js');
var tasks = require('./routes-tasks.js');
module.exports = [].concat(projects, tasks, items);
