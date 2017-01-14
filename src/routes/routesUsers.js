'use strict';
var Joi = require('joi');
var controllerUsers = require('./../controllers/ControllerUsers');

module.exports = [{
  method: 'GET',
  path: '/handle_openstreetmap_callback',
  handler: controllerUsers.auth
}, {
  method: 'GET',
  path: '/users',
  config: {
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin']
    },
    description: 'Returns  list of users',
    handler: controllerUsers.listUsers
  }
}, {
  method: 'GET',
  path: '/users/{userId}',
  config: {
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin']
    },
    description: 'Returns user detail',
    validate: {
      params: {
        userId: Joi.string().required()
      }
    },
    handler: controllerUsers.getUser
  }
}, {
  method: 'PUT',
  path: '/users',
  config: {
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin']
    },
    description: 'Change user role',
    validate: {
      payload: {
        userId: Joi.string().required(),
        role: Joi.string().valid('superadmin', 'machine', 'admin', 'editor').required()
      }
    },
    handler: controllerUsers.changeRole
  }
}, {
  method: 'DELETE',
  path: '/users',
  config: {
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin']
    },
    description: 'Delete a user',
    validate: {
      payload: {
        userId: Joi.string().required()
      }
    },
    handler: controllerUsers.deleteUser
  }
}, {
  method: 'GET',
  path: '/user/details',
  config: {
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin', 'machine', 'admin', 'editor']
    },
    description: 'Return User detail',
    handler: controllerUsers.userDetails
  }
}, {
  method: ['GET', 'POST'],
  path: '/logout',
  config: {
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin', 'machine', 'admin', 'editor']
    },
    description: 'Loging out',
    handler: controllerUsers.logout
  }
}];
