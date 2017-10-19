const db = require('../database/index');
const Project = db.Project;
const _ = require('lodash');
const ErrorHTTP = require('mapbox-error').ErrorHTTP;

module.exports = {
  getProjects: getProjects,
  createProject: createProject,
  getProject: getProject,
  updateProject: updateProject,
  deleteProject: deleteProject
};

/**
 * Get a list of projects.
 * @name get-projects
 * @example
 * curl https://host/projects
 *
 * [
 *   {
 *     id: '00000000-0000-0000-0000-000000000000',
 *     name: 'My Project',
 *     metadata: {},
 *     createdAt: '2017-10-18T00:00:00.000Z',
 *     updatedAt: '2017-10-18T00:00:00.000Z'
 *   }
 * ]
 */
function getProjects(req, res, next) {
  Project.findAll()
    .then(function(projects) {
      res.json(projects);
    })
    .catch(next);
}

/**
 * Create a project.
 * @name create-project
 * @param {Object} body - The request body
 * @param {string} body.name - The project name
 * @param {Object} [body.metadata={}] - The project metadata
 * @example
 * curl -X POST -H "Content-Type: application/json" -d '{"name":"My Project"}' https://host/projects
 *
 * {
 *   id: '00000000-0000-0000-0000-000000000000',
 *   metadata: {},
 *   name: 'My Project',
 *   updatedAt: '2017-10-19T00:00:00.000Z',
 *   createdAt: '2017-10-19T00:00:00.000Z'
 * }
 */
function createProject(req, res, next) {
  if (!req.body.name) next(new ErrorHTTP('req.body.name is required', 422));
  const values = { name: req.body.name };
  if (req.body.metadata) values.metadata = req.body.metadata;
  Project.create(values)
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

/**
 * Get a project.
 * @name get-project
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @example
 * curl https://host/projects/:project
 *
 * {
 *   id: '00000000-0000-0000-0000-000000000000',
 *   name: 'My Project',
 *   metadata: {},
 *   createdAt: '2017-10-18T00:00:00.000Z',
 *   updatedAt: '2017-10-18T00:00:00.000Z'
 * }
 */
function getProject(req, res, next) {
  Project.findOne({
    where: {
      id: req.params.project
    }
  })
    .then(function(project) {
      res.json(project);
    })
    .catch(next);
}

function updateProject(req, res, next) {
  const values = { id: req.params.project };
  if (req.body.metadata) values.metadata = req.body.metadata;
  Project.findOne({ where: { id: req.params.project } })
    .then(function(data) {
      if (data !== null) {
        const updated = _.merge({}, data.toJSON(), values);
        return data.update(updated);
      }
      values.metadata = values.metadata || {};
      return Project.create(values);
    })
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

function deleteProject(req, res, next) {
  return next();
}
