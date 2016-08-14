'use strict'
const Joi = require('joi');
const controllersTasks = require('./../controllers/tasks');

module.exports = [{
  method: 'GET',
  path: '/tasks',
  config: {
    handler: controllersTasks.listTasks
  }
}, {
  method: 'POST',
  path: '/tasks',
  config: {
    validate: {
      payload: {
        name: Joi.string().required(),
        idproject: Joi.string().required(),
        description: Joi.string().required(),
        changeset_comment: Joi.string().required(),
        file: Joi.object().required() //Joi.any().required(),
      }
    },
    payload: {
      maxBytes: 300000000,
      output: 'stream',
      parse: true,
      allow: 'multipart/form-data'
    },
    handler: controllersTasks.createTasks,
  }
}

// , {
//   method: 'PUT',
//   path: '/tasks/{idtask}',
//   config: {
//     validate: {
//       payload: {
//         name: Joi.string().required(),
//         idproject: Joi.string().required(),
//         description: Joi.string().required(),
//         changeset_comment: Joi.string().required(),
//         file: Joi.object().required() //Joi.any().required(),
//       },
//       params: {
//         idtask: Joi.string().required()
//       }
//     },
//     payload: {
//       maxBytes: 300000000,
//       output: 'stream',
//       parse: true,
//       allow: 'multipart/form-data'
//     },
//     handler: controllersTasks.updateTasks,
//   }
// }
];