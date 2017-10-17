'use strict';

/* External dependencies */
const bodyParser = require('body-parser');
const cors = require('cors');
const errors = require('mapbox-error');
const express = require('express');

/* Internal dependencies */
const authUser = require('./auth-user');
const db = require('../database/db');

/* Routes */
const tasks = require('../routes/tasks');
const items = require('../routes/items');

/* Server */
const server = (module.exports = express());

server.use(cors());
server.use(bodyParser.json());

/**
 * Get the status of server
 * @name get-status
 * @example
 * curl https://host/
 *  { status: 'OK' }
 */
server.get('/', function(req, res, next) {
  db
    .authenticate()
    .then(() => {
      res.json({ status: 'OK' });
    })
    .catch(next);
});

server.get('/tasks', tasks.getTasks);
server.get('/tasks/:task', tasks.getTask);
server.put('/tasks/:task', authUser, tasks.updateTask);

server.get('/tasks/:task/items', items.getItems);
server.get('/tasks/:task/items/:item', items.getItem);
server.put('/tasks/:task/items/:item', authUser, items.updateItem);

/*
// Endpoints to add to complete CRUD operations
const itemComments = require('../routes/item-comments');
const itemTags = require('../routes/item-tags');

// Tasks
server.post('/tasks', authUser, tasks.createTask);
server.delete('/tasks/:task', authUser, tasks.deleteTask);

// Items
server.post('/tasks/:task/items', authUser, items.createItem);
server.delete('/tasks/:task/items/:item', authUser, items.deleteItem);

// Comments
server.get('/tasks/:task/items/:items/comments', itemComments.getItemComments);
server.get('/tasks/:task/items/:items/comments/:comment', itemComments.getItemComment);
server.post('/tasks/:task/items/:items/comments', itemComments.createItemComment);
server.put('/tasks/:task/items/:items/comments/:comment', itemComments.updateItemComment);
server.delete('/tasks/:task/items/:items/comments/:comment', itemComments.deleteItemComment);

// Tags
server.get('/tasks/:task/items/:items/tags', itemTags.getItemTags);
server.get('/tasks/:task/items/:items/tags/:tag', itemTags.getItemTag);
server.post('/tasks/:task/items/:items/tags', itemTags.createItemTag);
server.put('/tasks/:task/items/:items/tags/:tag', itemTags.updateItemTag);
server.delete('/tasks/:task/items/:items/tags/:tag', itemTags.deleteItemTag);
*/

server.use(errors.showError);
server.use(function(req, res) {
  res.status(404).json({ message: 'Not Found' });
});
