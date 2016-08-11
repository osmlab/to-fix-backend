'use strict';

const Joi = require('joi');
const controllersTasks = require('./src/controllers/tasks');

module.exports = [{
  method: 'GET',
  path: '/tasks',
  config: {
    validate: {
      query: {
        name: Joi.string()
      }
    },
    handler: controllersTasks.tasks
  }
}, {
  method: 'GET',
  path: '/tasks/{idstr}',
  config: {
    description: 'Get specific item for the task',
    notes: 'Get specific item for the task',
    validate: {
      params: {
        idstr: Joi.string().required()
      }
    },
    handler: controllersTasks.findeOne
  }
}, {
  method: 'POST',
  path: '/tasks',
  config: {
    validate: {
      payload: {
        idstr: Joi.string().required(),
        name: Joi.string().required(),
        description: Joi.string().required(),
        changeset_comment: Joi.string().required(),
        file: Joi.object().required() //Joi.any().required(),
      }
    },
    payload: {
      output: 'stream',
      parse: true,
      allow: 'multipart/form-data'
    },
    handler: controllersTasks.createTasks,
  }
}];