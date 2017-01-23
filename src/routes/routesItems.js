'use strict';
var Joi = require('joi');
var ControllerItems = require('./../controllers/ControllerItems');

module.exports = [{
  method: 'POST',
  path: '/tasks/{idtask}/{type}/items',
  config: {
    description: 'Returns a item randomly',
    validate: {
      payload: {
        user: Joi.string().allow(''),
        editor: Joi.string().allow('')
      },
      params: {
        idtask: Joi.string().required(),
        type: Joi.string().required()
      }
    },
    handler: ControllerItems.getAItem
  }
}, {
  method: 'POST',
  path: '/tasks/{idtask}/{type}/items/{numitems}',
  config: {
    description: 'Returns a  group of items randomly, min: 2 , max: 50',
    validate: {
      payload: {
        user: Joi.string().allow(''),
        editor: Joi.string().allow('')
      },
      params: {
        idtask: Joi.string().required(),
        type: Joi.string().required(),
        numitems: Joi.number().integer().min(2).max(50).required()
      }
    },
    handler: ControllerItems.getGroupItems
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}/{type}/items/{key}',
  config: {
    description: 'Returns the data from a specific item',
    validate: {
      params: {
        idtask: Joi.string().required(),
        type: Joi.string().required(),
        key: Joi.string().required()
      }
    },
    handler: ControllerItems.getItemById
  }
}, {
  method: 'PUT',
  path: '/tasks/{idtask}/{type}/items',
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
        idtask: Joi.string().required(),
        type: Joi.string().required()
      }
    },
    handler: ControllerItems.updateItem
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}/items/action/{action}',
  config: {
    description: 'Returns the list of items id from a task according an action',
    validate: {
      params: {
        idtask: Joi.string().required(),
        action: Joi.string().required()
      }
    },
    handler: ControllerItems.getAllItemsIdByAction
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}/{type}/items',
  config: {
    description: 'Returns the list all items in the task, this could take some time',
    validate: {
      params: {
        idtask: Joi.string().required(),
        type: Joi.string().required()
      }
    },
    handler: ControllerItems.getAllItems
  }
}, {
  method: 'GET',
  path: '/tasks/{idtask}/{type}/count',
  config: {
    description: 'Returns the number of item that exists in the task',
    validate: {
      params: {
        idtask: Joi.string().required(),
        type: Joi.string().required()
      }
    },
    handler: ControllerItems.countItems
  }
}, {
  method: 'POST',
  path: '/tasks/{idtask}/{type}/items/unlocked',
  config: {
    description: 'Unlocked group of items, those items should be separated by comma',
    validate: {
      payload: {
        groupIds: Joi.string().required()
      },
      params: {
        idtask: Joi.string().required(),
        type: Joi.string().required()
      }
    },
    handler: ControllerItems.UnlockedItems
  }
}];
