'use strict';

const _ = require('lodash');
const ErrorHTTP = require('mapbox-error').ErrorHTTP;

const db = require('../database/index');
const Project = db.Project;
const validateBody = require('../lib/helper/validateBody');

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
  const validBodyAttrs = ['name', 'metadata'];
  const requiredBodyAttr = ['name'];
  const validationError = validateBody(
    req.body,
    validBodyAttrs,
    requiredBodyAttr
  );
  if (validationError) return next(new ErrorHTTP(validationError, 400));

  Project.create(req.body)
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
 * curl https://host/projects/00000000-0000-0000-0000-000000000000
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
  Project.findOne({ where: { id: req.params.project } })
    .then(function(project) {
      if (!project) return next();
      res.json(project);
    })
    .catch(next);
}

/**
 * Update a project.
 * @name updateProject
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {Object} body - The request body
 * @example
 * curl -X PUT -H "Content-Type: application/json" -d '{"metadata":{"key":"value"}}' https://host/projects/00000000-0000-0000-0000-000000000000
 *
 * {
 *   id: '00000000-0000-0000-0000-000000000000',
 *   name: 'My Project',
 *   metadata: {
 *     key: "value"
 *   },
 *   createdAt: '2017-10-18T00:00:00.000Z',
 *   updatedAt: '2017-10-18T00:00:00.000Z'
 * }
 */
function updateProject(req, res, next) {
  const validBodyAttrs = ['name', 'metadata'];
  const validationError = validateBody(req.body, validBodyAttrs);
  if (validationError) return next(new ErrorHTTP(validationError, 400));

  Project.findOne({ where: { id: req.params.project } })
    .then(function(project) {
      if (!project) return next();
      const updated = _.merge({}, project.toJSON(), req.body);
      return project.update(updated);
    })
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

/**
 * Delete a project.
 * @name deleteProject
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @example
 * curl -X DELETE https://host/projects/00000000-0000-0000-0000-000000000000
 *
 * 1
 */
function deleteProject(req, res, next) {
  Project.destroy({ where: { id: req.params.project } })
    .then(function(data) {
      if (data !== 1) return next();
      res.json(data);
    })
    .catch(next);
}
