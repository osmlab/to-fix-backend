'use strict';
var Joi = require('joi');
var controllersItem = require('./../controllers/ControllesItems');

module.exports = [{
  method: 'POST',
  path: '/tasks/{idtask}/items',
  config: {
    description: 'Return a item randomly',
    validate: {
      payload: {
        user: Joi.string().required(),
        editor: Joi.string().required()
      },
      params: {
        idtask: Joi.string().required()
      }
    },
    handler: controllersItem.getItem
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}/items/{key}',
  config: {
    description: 'Return the data from a specific item',
    validate: {
      params: {
        idtask: Joi.string().required(),
        key: Joi.string().required()
      }
    },
    handler: controllersItem.getItemById
  }
}, {
  method: 'PUT',
  path: '/tasks/{idtask}/items',
  config: {
    description: 'Update a item with an action(fixed or noterror)',
    validate: {
      payload: {
        action: Joi.string().required(),
        user: Joi.string().required(),
        editor: Joi.string().required(),
        key: Joi.string().required()
      },
      params: {
        idtask: Joi.string().required()
      }
    },
    handler: controllersItem.updateItem
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}/items',
  config: {
    description: 'Return the list of items in the task',
    validate: {
      params: {
        idtask: Joi.string().required()
      }
    },
    handler: controllersItem.getAllItems
  }
}];
