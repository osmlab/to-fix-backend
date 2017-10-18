'use strict';

/* Load env vars from .env file */
require('dotenv').load();

/* External dependencies */
const bodyParser = require('body-parser');
const cors = require('cors');
const errors = require('mapbox-error');
const express = require('express');
const session = require('express-session');

/* Internal dependencies
const authUser = require('./auth-user');
*/

/* Routes */
const status = require('../routes/status');
const project = require('../routes/project');
const item = require('../routes/item');
const auth = require('../routes/auth');

/* Server */
const server = (module.exports = express());

/* Middleware */
const middleware = require('./middleware');

server.use(cors());
server.use(bodyParser.json());
server.use(middleware);
server.use(
  session({
    secret: process.env.APP_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' }
  })
);

server.get('/', status.getStatus);

server.get('/projects', project.getProjects);
server.post('/projects', project.createProject);
server.get('/projects/:project', project.getProject);

server.get('/projects/:project/items', item.getItems);
server.post('/projects/:project/items', item.createItem);
server.get('/projects/:project/items/:item', item.getItem);

/*
server.put('/projects/:project', authUser, project.updateProject);
server.put('/projects/:project/items/:item', authUser, item.updateItem);
*/

server.get('/auth/openstreetmap', auth.redirectOsmAuth);
server.get('/auth/openstreetmap/callback', auth.handleOSMCallback);

server.use(errors.showError);
server.use(function(req, res) {
  res.status(404).json({ message: 'Not Found' });
});
