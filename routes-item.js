'use strict';

const Joi = require('joi');
const controllersItem = require('./src/controllers/item');

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
  method: 'GET',
  path: '/tasks/{idtask}/items',
  config: {
    description: 'Get ramdom item for the task',
    notes: 'Get ramdom item for the task',
    validate: {
      params: {
        idtask: Joi.string().required()
      }
    },
    handler: controllersItem.getItem
  }
}];