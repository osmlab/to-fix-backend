'use strict';

const Joi = require('joi');
const controllersItem = require('./../controllers/items');

module.exports = [{
    method: 'GET',
    path: '/tasks/{idtask}/items/{iditem}',
    config: {
      description: 'Get specific item for the task',
      notes: 'Get specific item for the task',
      validate: {
        params: {
          idtask: Joi.string().required(),
          iditem: Joi.string().required()
        }
      },
      handler: controllersItem.getItemById
    }
  }, {
    method: 'POST',
    path: '/tasks/{idtask}/items',
    config: {
      description: 'Get a item randomly, or update a item, in both cases it will return a new item',
      notes: 'To update a item is required action and iditem',
      validate: {
        payload: {
          action: Joi.string(),
          iditem: Joi.string(),
          user: Joi.string().required()
        },
        params: {
          idtask: Joi.string().required()
        }
      },
      handler: controllersItem.getItem
    }
  }, {
    method: 'GET',
    path: '/tasks/{idtask}/items',
        config: {
      description: 'Get all items for the task',
      validate: {
        params: {
          idtask: Joi.string().required()
        }
      },
    handler: controllersItem.getAllItems
    }
  }
  // {
  //   method: 'POST',
  //   path: '/tasks/{idtask}/items/track',
  //   config: {
  //     description: 'Update a item with an action',
  //     validate: {
  //       payload: {
  //         iditem: Joi.string().required(),
  //         action: Joi.string().required(),
  //         user: Joi.string().required()
  //       },
  //       params: {
  //         idtask: Joi.string().required()
  //       }
  //     },
  //     handler: controllersItem.updateItem
  //   }
  // }


];