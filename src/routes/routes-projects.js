'use strict';
var Joi = require('joi');
var controllersProjects = require('./../controllers/projects');

module.exports = [{
  method: 'GET',
  path: '/projects',
  config: {
    tags: ['api'],
    description: 'Get all projects',
    handler: controllersProjects.getAllProjects
  }
}, {
  method: 'GET',
  path: '/projects/{idproject}',
  config: {
    tags: ['api'],
    description: 'Get specific project data',
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
    description: 'Save project data',
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
    description: 'Update specific project data',
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
}, {
  method: 'GET',
  path: '/projects/{idproject}/tasks',
  config: {
    description: 'Get all tasks in a project',
    validate: {
      params: {
        idproject: Joi.string().required()
      }
    },
    handler: controllersProjects.getTasksPerProject
  }
}];
