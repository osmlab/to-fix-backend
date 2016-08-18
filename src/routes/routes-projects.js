'use strict';
var Joi = require('joi');
var controllersProjects = require('./../controllers/projects');

module.exports = [{
  method: 'GET',
  path: '/projects',
  config: {
    description: 'Return a list fo all projects',
    handler: controllersProjects.getAllProjects
  }
}, {
  method: 'GET',
  path: '/projects/{idproject}',
  config: {
    description: 'Return a specific project information, it includes all tasks existing in the project',
    validate: {
      params: {
        idproject: Joi.string().required()
      }
    },
    handler: controllersProjects.getAProjects
  }
}, {
  method: 'POST',
  path: '/projects',
  config: {
    description: 'Ceate a project',
    validate: {
      payload: {
        name: Joi.string().required(),
        admin: Joi.string().required()
      }
    },
    handler: controllersProjects.saveProjects
  }
}, {
  method: 'PUT',
  path: '/projects/{idproject}',
  config: {
    description: 'Update a specific project data',
    validate: {
      params: {
        idproject: Joi.string().required()
      },
      payload: {
        name: Joi.string(),
        admin: Joi.string(),
        status: Joi.string()

      }
    },
    handler: controllersProjects.updateProjects
  }
}, {
  method: 'DELETE',
  path: '/projects/{idproject}',
  config: {
    description: 'Remove specific project data',
    validate: {
      params: {
        idproject: Joi.string().required()
      }
    },
    handler: controllersProjects.deleteProjects
  }
}];