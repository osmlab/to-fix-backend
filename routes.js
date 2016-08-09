"use strict";

const Joi = require('joi');
const controllersTasks= require('./src/controllers/tasks');


module.exports = [{
  method: 'GET',
  path: '/tasks',
  config: {
    validate: {
      query: {
        name: Joi.string()
      }
    },
    handler: function(request, reply) {
      console.log('hola');
    }
  }
}, {
  method: 'GET',
  path: '/tasks/{id}',
  handler: function(request, reply) {
    console.log('hola2');

  }
}, {
  method: 'POST',
  path: '/tasks',
  config: {
    validate: {
      payload: {
        name: Joi.string().required().min(3)
      }
    },
    handler: function(request, reply) {
      console.log('hola3');

    }
  }
}];