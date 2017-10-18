'use strict';

/* External dependencies */
const bodyParser = require('body-parser');
const cors = require('cors');
const errors = require('mapbox-error');
const express = require('express');

/* Internal dependencies */
const authUser = require('./auth-user');

/* Routes */
const status = require('../routes/status');
const project = require('../routes/project');
const item = require('../routes/item');

/* Server */
const server = (module.exports = express());

/* Middleware */
const middleware = require('./middleware');

server.use(cors());
server.use(bodyParser.json());
server.use(middleware);

server.get('/', status.getStatus);

server.get('/projects', project.getProjects);
server.get('/projects/:project', project.getProject);
server.put('/projects/:project', authUser, project.updateProject);

server.get('/projects/:project/items', item.getItems);
server.get('/projects/:project/items/:item', item.getItem);
server.put('/projects/:project/items/:item', authUser, item.updateItem);

server.use(errors.showError);
server.use(function(req, res) {
  res.status(404).json({ message: 'Not Found' });
});
