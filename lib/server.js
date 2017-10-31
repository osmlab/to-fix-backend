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
const comment = require('../routes/comment');
const tag = require('../routes/tag');
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
server.use(
  bodyParser.json({
    limit: '50mb'
  })
);
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

server.get('/:version/user', user.getUser);

server.get('/:version/projects', project.getProjects);
server.post('/:version/projects', project.createProject);
server.get('/:version/projects/:project', project.getProject);
server.put('/:version/projects/:project', project.updateProject);
server.get('/:version/projects/:project/stats', project.getProjectStats);

server.get('/:version/projects/:project/items', item.getItems);
server.post('/:version/projects/:project/items', item.createItem);
server.get('/:version/projects/:project/items/:item', item.getItem);
server.put('/:version/projects/:project/items/:item', item.updateItem);

server.get('/:version/projects/:project/tags', tag.getProjectTags);
server.post('/:version/projects/:project/tags', tag.createProjectTag);
server.get('/:version/projects/:project/tags/:tag', tag.getProjectTag);
server.put('/:version/projects/:project/tags/:tag', tag.updateProjectTag);
server.delete('/:version/projects/:project/tags/:tag', tag.deleteProjectTag);
server.get('/:version/projects/:project/items/:item/tags', tag.getItemTags);
server.post('/:version/projects/:project/items/:item/tags', tag.createItemTag);
server.delete(
  '/:version/projects/:project/items/:item/tags/:tag',
  tag.deleteItemTag
);

server.get('/:version/auth/openstreetmap', auth.redirectOsmAuth);
server.get('/:version/auth/openstreetmap/callback', auth.handleOSMCallback);

server.get(
  '/:version/projects/:project/items/:item/comments',
  comment.getItemComments
);
server.post(
  '/:version/projects/:project/items/:item/comments',
  comment.createItemComment
);
server.delete(
  '/:version/projects/:project/items/:item/comments/:comment',
  comment.deleteItemComment
);

server.use(errors.showError);
server.use(function(req, res) {
  res.status(404).json({ message: 'Not Found' });
});
