'use strict';
var Joi = require('joi');
var ControllerSettings = require('./../controllers/ControllerSettings');

module.exports = [{
  method: 'POST',
  path: '/settings/create',
  config: {
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin']
    },
    description: 'Create',
    validate: {
      payload: {
        index: Joi.string().required(),
        type: Joi.string().required(),
        id: Joi.string().required(),
        obj: Joi.any()
      }
    },
    handler: ControllerSettings.create
  }
}, {
  method: 'POST',
  path: '/settings/stats',
  config: {
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin']
    },
    description: 'Create stats',
    validate: {
      payload: {
        index: Joi.string().required(),
        type: Joi.string().required(),
        id: Joi.string().required(),
        obj: Joi.any()
      }
    },
    handler: ControllerSettings.createstats
  }
}, {
  method: 'POST',
  path: '/settings/noterror',
  config: {
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin']
    },
    description: 'Create NotError',
    validate: {
      payload: {
        index: Joi.string().required(),
        type: Joi.string().required(),
        id: Joi.string().required(),
        obj: Joi.any()
      }
    },
    handler: ControllerSettings.createnoterror
  }
}, {
  method: 'POST',
  path: '/settings/update',
  config: {
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin']
    },
    description: 'Update',
    validate: {
      payload: {
        index: Joi.string().required(),
        type: Joi.string().required(),
        id: Joi.string().required(),
        obj: Joi.any()
      }
    },
    handler: ControllerSettings.update
  }
}, {
  method: 'POST',
  path: '/settings/tasksdetails',
  config: {
    auth: {
      strategies: ['jwt'],
      scope: ['superadmin']
    },
    description: 'Update tasks details',
    validate: {
      payload: {
        index: Joi.string().required(),
        type: Joi.string().required(),
        id: Joi.string().required(),
        obj: Joi.any()
      }
    },
    handler: ControllerSettings.tasksStaks
  }
}];
