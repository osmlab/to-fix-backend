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
const projects = require('../routes/projects');
const items = require('../routes/items');
const itemTags = require('../routes/item-tags');

/* Server */
const server = (module.exports = express());

/* Middleware */
const middleware = require('./middleware');

server.use(cors());
server.use(bodyParser.json());
server.use(middleware);

server.get('/', status.getStatus);

server.get('/projects', projects.getProjects);
server.get('/projects/:project', projects.getProject);
server.put('/projects/:project', authUser, projects.updateProject);

server.get('/projects/:project/items', items.getItems);
server.get('/projects/:project/items/:item', items.getItem);
server.put('/projects/:project/items/:item', authUser, items.updateItem);

/*
// Endpoints to add to complete CRUD operations
const itemComments = require('../routes/item-comments');
const itemTags = require('../routes/item-tags');

// Projects
server.post('/projects', authUser, projects.createProject);
server.delete('/projects/:project', authUser, projects.deleteProject);

// Items
server.post('/projects/:project/items', authUser, items.createItem);
server.delete('/projects/:project/items/:item', authUser, items.deleteItem);

// Comments
server.get('/projects/:project/items/:items/comments', itemComments.getItemComments);
server.get('/projects/:project/items/:items/comments/:comment', itemComments.getItemComment);
server.post('/projects/:project/items/:items/comments', itemComments.createItemComment);
server.put('/projects/:project/items/:items/comments/:comment', itemComments.updateItemComment);
server.delete('/projects/:project/items/:items/comments/:comment', itemComments.deleteItemComment);
*/

server.get('/projects/:project/tags', itemTags.getProjectTags);
server.post('/projects/:project/tags', itemTags.createProjectTag);
server.get('/projects/:project/tags/:tag', itemTags.getProjectTag);
server.put('/projects/:project/tags/:tag', itemTags.updateProjectTag);
server.delete('/projects/:project/tags/:tag', itemTags.deleteProjectTag);
// server.get('/projects/:project/items/:items/tags', itemTags.getItemTags);
// server.get('/projects/:project/items/:items/tags/:tag', itemTags.getItemTag);
// server.post('/projects/:project/items/:items/tags', itemTags.createItemTag);
// server.put('/projects/:project/items/:items/tags/:tag', itemTags.updateItemTag);
// server.delete('/projects/:project/items/:items/tags/:tag', itemTags.deleteItemTag);

server.use(errors.showError);
server.use(function(req, res) {
  res.status(404).json({ message: 'Not Found' });
});
