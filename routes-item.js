'use strict';

const Joi = require('joi');
const controllersItem = require('./src/controllers/item');

module.exports = [{
  method: 'GET',
  path: '/{idtask}',
  config: {
    validate: {
      params: {
        idtask: Joi.string().required()
      }
    },
    handler: controllersItem.item
  }
}];