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
  path: '/tasks/{id}',
  handler: controllersTasks.findeOne
}, {
  method: 'POST',
  path: '/tasks',
  config: {
    validate: {
      payload: {
        taskname: Joi.string().required(),
        taskid: Joi.string().required(),
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