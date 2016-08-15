'use strict';
var Joi = require('joi');
var controllersTasks = require('./../controllers/tasks');

module.exports = [{
  method: 'GET',
  path: '/tasks',
  config: {
    handler: controllersTasks.listTasks
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}',
  config: {
    validate: {
      params: {
        idtask: Joi.string().required()
      }
    },
    handler: controllersTasks.listTasksById
  }
}, {
  method: 'POST',
  path: '/tasks',
  config: {
    validate: {
      payload: {
        name: Joi.string().required(),
        idproject: Joi.string().required(),
        description: Joi.string().required(),
        changeset_comment: Joi.string().required(),
        file: Joi.object().required() //Joi.any().required(),
      }
    },
    payload: {
      maxBytes: 300000000,
      output: 'stream',
      parse: true,
      allow: 'multipart/form-data'
    },
    handler: controllersTasks.createTasks
  }
}, {
  method: 'PUT',
  path: '/tasks/{idtask}',
  config: {
    validate: {
      payload: {
        id: Joi.number().required(),
        name: Joi.string().required(),
        idproject: Joi.string().required(),
        description: Joi.string().required(),
        changeset_comment: Joi.string().required(),
        file: Joi.object()
      },
      params: {
        idtask: Joi.string().required()
      }
    },
    payload: {
      maxBytes: 300000000,
      output: 'stream',
      parse: true,
      allow: 'multipart/form-data'
    },
    handler: controllersTasks.updateTasks
  }
}, {
  method: 'DELETE',
  path: '/tasks/{idtask}',
  config: {
    description: 'Remove specific task',
    validate: {
      params: {
        idtask: Joi.string().required()
      }
    },
    handler: controllersTasks.deleteTasks
  }
}, {
  method: 'GET',
  path: '/count/{idtask}',
  config: {
    description: 'Returns the count of the total number of items and all available items for a given task',
    validate: {
      params: {
        idtask: Joi.string().required()
      }
    },
    handler: controllersTasks.deleteTasks
  }
}];
