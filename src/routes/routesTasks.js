'use strict';
var Joi = require('joi');
var controllersTasks = require('./../controllers/ControllesTasks');

module.exports = [{
  method: 'GET',
  path: '/tasks',
  config: {
    description: 'Returns all the list of existing tasks',
    handler: controllersTasks.listTasks
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}',
  config: {
    description: 'Returns a specific tasks',
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
    description: 'Create a task',
    validate: {
      payload: {
        name: Joi.string().required(),
        description: Joi.string().required(),
        changesetComment: Joi.string().required(),
        password: Joi.string().required(),
        file: Joi.object().required()
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
  path: '/tasks',
  config: {
    description: 'Update a task',
    validate: {
      payload: {
        idtask: Joi.string().required(),
        name: Joi.string().required(),
        description: Joi.string().required(),
        changesetComment: Joi.string().required(),
        password: Joi.string().required(),
        status: Joi.string().required(), // false = if a task is flagged as finished by user
        file: Joi.object()
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
  path: '/tasks',
  config: {
    description: 'Delete a specific task',
    validate: {
      payload: {
        idtask: Joi.string().required(),
        password: Joi.string().required()
      }
    },
    handler: controllersTasks.deleteTasks
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}/activity/{from}/{to}',
  config: {
    description: 'Return activity in the task',
    validate: {
      params: {
        idtask: Joi.string().required(),
        from: Joi.string().required(),
        to: Joi.string().required()
      }
    },
    handler: controllersTasks.listTasksActivity
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}/activity/{user}/{from}/{to}',
  config: {
    description: 'Return the user activity in the task',
    validate: {
      params: {
        idtask: Joi.string().required(),
        user: Joi.string().required(),
        from: Joi.string().required(),
        to: Joi.string().required()
      }
    },
    handler: controllersTasks.listTasksActivityByUser
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}/track_stats/{from}/{to}',
  config: {
    description: 'Return the tracking stats',
    validate: {
      params: {
        idtask: Joi.string().required(),
        from: Joi.string().required(),
        to: Joi.string().required()
      }
    },
    handler: controllersTasks.trackStats
  }
}];
