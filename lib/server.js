'use strict';

require('dotenv').load();

const bodyParser = require('body-parser');
const cors = require('cors');
const errors = require('mapbox-error');
const express = require('express');
const session = require('express-session');

// const authUser = require('./auth-user');

const status = require('../routes/status');
const project = require('../routes/project');
const item = require('../routes/item');
const auth = require('../routes/auth');

const server = (module.exports = express());

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
server.put('/projects/:project', project.updateProject);

server.get('/projects/:project/items', item.getItems);
server.post('/projects/:project/items', item.createItem);
server.get('/projects/:project/items/:item', item.getItem);

/*
server.put('/projects/:project/items/:item', authUser, item.updateItem);
*/

server.get('/auth/openstreetmap', auth.redirectOsmAuth);
server.get('/auth/openstreetmap/callback', auth.handleOSMCallback);

server.use(errors.showError);
server.use(function(req, res) {
  res.status(404).json({ message: 'Not Found' });
});
