'use strict';
var Joi = require('joi');
var controllerUsers = require('./../controllers/ControllerUsers');

module.exports = [{
  method: 'GET',
  path: '/handle_openstreetmap_callback',
  handler: controllerUsers.auth
}, {
  method: 'GET',
  path: '/users/details',
  handler: controllerUsers.userDetails
}, {
  method: 'GET',
  path: '/users/{user}',
  config: {
    description: 'Returns a user',
    validate: {
      params: {
        user: Joi.string().required()
      }
    },
    handler: controllerUsers.getUser
  }
}, {
  method: 'POST',
  path: '/users/{user}',
  config: {
    description: 'Change user role',
    validate: {
      payload: {
        role: Joi.string().valid('superadmin', 'admin', 'editor').required()
      },
      params: {
        user: Joi.string().required()
      }
    },
    handler: controllerUsers.changeRole
  }
}];
