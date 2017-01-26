'use strict';
var Joi = require('joi');
var ControllerTasks = require('./../controllers/ControllerTasks');

module.exports = [{
  method: 'GET',
  path: '/tasks',
  config: {
    description: 'Returns the list of existing tasks',
    handler: ControllerTasks.listTasks
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
    handler: ControllerTasks.listTasksById
  }
}, {
  method: 'POST',
  path: '/tasks',
  config: {
    description: 'Create a task',
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin', 'admin']
    },
    validate: {
      payload: {
        name: Joi.string().required(),
        description: Joi.string().required(),
        changesetComment: Joi.string().required(),
        file: Joi.object().required()
      }
    },
    payload: {
      maxBytes: 50000000,
      output: 'stream',
      parse: true,
      allow: 'multipart/form-data'
    },
    handler: ControllerTasks.createTasks
  }
}, {
  method: 'PUT',
  path: '/tasks',
  config: {
    description: 'Update a task',
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin', 'admin', 'machine']
    },
    pre: [{
      method: ControllerTasks.verifyRole
    }],
    validate: {
      payload: {
        idtask: Joi.string().required(),
        name: Joi.string().required(),
        description: Joi.string().required(),
        changesetComment: Joi.string().required(),
        isCompleted: Joi.string().required(), // true = if a task is flagged as completed by user
        file: Joi.object()
      }
    },
    payload: {
      maxBytes: 50000000,
      output: 'stream',
      parse: true,
      allow: 'multipart/form-data'
    },
    handler: ControllerTasks.updateTasks
  }
}, {
  method: 'DELETE',
  path: '/tasks',
  config: {
    description: 'Delete a task',
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin', 'admin']
    },
    pre: [{
      method: ControllerTasks.verifyRole
    }],
    validate: {
      payload: {
        idtask: Joi.string().required()
      }
    },
    handler: ControllerTasks.deleteTasks
  }
}, {
  method: ['POST'],
  path: '/setting/tasks',
  config: {
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin']
    },
    description: 'Settings a obj',
    validate: {
      payload: {
        index: Joi.string().required(),
        type: Joi.string().required(),
        id: Joi.string().required(),
        obj: Joi.any()
      }
    },
    handler: ControllerTasks.settingTasks
  }
}, {
  method: ['POST'],
  path: '/setting/items',
  config: {
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin']
    },
    description: 'Settings items',
    validate: {
      payload: {
        index: Joi.string().required(),
        type: Joi.string().required(),
        id: Joi.string().required(),
        obj: Joi.any()
      }
    },
    handler: ControllerTasks.settingItems
  }
}];
