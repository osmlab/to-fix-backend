'use strict';
var Joi = require('joi');
var ControllerStats = require('./../controllers/ControllerStats');

module.exports = [{
  method: 'GET',
  path: '/tasks/{idtask}/activity',
  config: {
    description: 'Return last activities in the task',
    validate: {
      params: {
        idtask: Joi.string().required()
      }
    },
    handler: ControllerStats.listTasksActivity
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
