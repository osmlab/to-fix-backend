'use strict';
var Joi = require('joi');
var ControllerItems = require('./../controllers/ControllerItems');

module.exports = [{
  method: 'POST',
  path: '/tasks/{idtask}/items',
  config: {
    description: 'Return a item randomly',
    validate: {
      payload: {
        user: Joi.string().allow(''),
        editor: Joi.string().allow('')
      },
      params: {
        idtask: Joi.string().required()
      }
    },
    handler: ControllerItems.getAItem
  }
}, {
  method: 'POST',
  path: '/tasks/{idtask}/items/{numitems}',
  config: {
    description: 'Return a  group of items randomly, min: 2 , max: 50',
    validate: {
      payload: {
        user: Joi.string().allow(''),
        editor: Joi.string().allow('')
      },
      params: {
        idtask: Joi.string().required(),
        numitems: Joi.number().integer().min(2).max(50).required()
      }
    },
    handler: ControllerItems.getGroupItems
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
    handler: ControllerItems.getItemById
  }
}, {
  method: 'PUT',
  path: '/tasks/{idtask}/items',
  config: {
    description: 'Update a item with an action(fixed, noterror or skip)',
    validate: {
      payload: {
        action: Joi.string().valid('fixed', 'noterror', 'skip').required(),
        user: Joi.string().required(),
        editor: Joi.string().required(),
        key: Joi.string().required()
      },
      params: {
        idtask: Joi.string().required()
      }
    },
    handler: ControllerItems.updateItem
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}/items/action/{action}',
  config: {
    description: 'Return the list of id items from a task according an action',
    validate: {
      params: {
        idtask: Joi.string().required(),
        action: Joi.string().required()
      }
    },
    handler: ControllerItems.getAllItemsByAction
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}/items',
  config: {
    description: 'Return the list of 100 first items in the task',
    validate: {
      params: {
        idtask: Joi.string().required()
      }
    },
    handler: ControllerItems.getAllItems
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}/count',
  config: {
    description: 'Returns the amount of item that exists in the task',
    validate: {
      params: {
        idtask: Joi.string().required()
      }
    },
    handler: ControllerItems.countItems
  }
}, {
  method: 'POST',
  path: '/tasks/{idtask}/items/unlocked',
  config: {
    description: 'Unlocked group of items, those items should be separated by comma',
    validate: {
      payload: {
        groupIds: Joi.string().required()
      },
      params: {
        idtask: Joi.string().required()
      }
    },
    handler: ControllerItems.UnlockedItems
  }
}];
