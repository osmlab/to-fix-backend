'use strict';
var Joi = require('joi');
var ControllerStats = require('./../controllers/ControllerStats');

module.exports = [{
  method: 'GET',
  path: '/tasks/{idtask}/activity/{from}/{to}',
  config: {
    description: 'Return activity in the task, e.g: /tasks/{idtask}/activity/from:2016-11-01/to:2016-11-30',
    validate: {
      params: {
        idtask: Joi.string().required(),
        from: Joi.string().required(),
        to: Joi.string().required()
      }
    },
    handler: ControllerStats.listTasksActivity
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}/activity/{user}/{from}/{to}',
  config: {
    description: 'Return the user activity in the task, e.g: /tasks/{idtask}/activity/{user}/from:2016-11-01/to:2016-11-30',
    validate: {
      params: {
        idtask: Joi.string().required(),
        user: Joi.string().required(),
        from: Joi.string().required(),
        to: Joi.string().required()
      }
    },
    handler: ControllerStats.listTasksActivityByUser
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}/track_stats/{from}/{to}',
  config: {
    description: 'Return the tracking stats, e.g:/tasks/{idtask}/track_stats/from:2016-11-01/to:2016-11-30',
    validate: {
      params: {
        idtask: Joi.string().required(),
        from: Joi.string().required(),
        to: Joi.string().required()
      }
    },
    handler: ControllerStats.trackStats
  }
}];
