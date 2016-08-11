'use strict';
const items = require('./routes-items.js');
const projects = require('./routes-projects.js');
const tasks = require('./routes-tasks.js');

module.exports = [].concat(projects, tasks, items);