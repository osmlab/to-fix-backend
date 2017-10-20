'use strict';

require('dotenv').load();

const bodyParser = require('body-parser');
const cors = require('cors');
const errors = require('mapbox-error');
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const status = require('../routes/status');
const project = require('../routes/project');
const item = require('../routes/item');
const auth = require('../routes/auth');
const user = require('../routes/user');
const server = (module.exports = express());

const middleware = require('./middleware');
const db = require('../database/index');

const sessionStore = new SequelizeStore({
  db: db,
  checkExpirationInterval: process.env.NODE_ENV === 'test' ? -1 : 60 * 1000
});

server.use(cors());
server.use(bodyParser.json());
server.use(middleware);
server.use(
  session({
    store: sessionStore,
    secret: process.env.APP_SECRET,
    resave: false,
    saveUninitialized: true,
    proxy: true,
    cookie: { secure: 'auto' }
  })
);

server.get('/', status.getStatus);

server.get('/user', user.getUser);

server.get('/projects', project.getProjects);
server.post('/projects', project.createProject);
server.get('/projects/:project', project.getProject);
server.put('/projects/:project', project.updateProject);

server.get('/projects/:project/items', item.getItems);
server.post('/projects/:project/items', item.createItem);
server.get('/projects/:project/items/:item', item.getItem);
server.put('/projects/:project/items/:item', item.updateItem);

server.get('/auth/openstreetmap', auth.redirectOsmAuth);
server.get('/auth/openstreetmap/callback', auth.handleOSMCallback);

server.use(errors.showError);
server.use(function(req, res) {
  res.status(404).json({ message: 'Not Found' });
});
