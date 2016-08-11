'use strict';

const Joi = require('joi');
const controllersTasks = require('./src/controllers/tasks');

module.exports = [{
  method: 'GET',
  path: '/tasks',
  config: {
    handler: controllersTasks.listTasks
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