const db = require('../database/index');
const Project = db.Project;
const _ = require('lodash');

module.exports = {
  getProjects: getProjects,
  getProject: getProject,
  createProject: createProject,
  updateProject: updateProject,
  deleteProject: deleteProject
};

/**
 * Get a list of projects
 * @name get-projects
 * @example
 * curl https://host/projects/project-id
 *  [{
 *    id: 'one',
 *    metadata: {}
 *  }]
 */
function getProjects(req, res, next) {
  Project.findAll()
    .then(function(projects) {
      res.json(projects);
    })
    .catch(next);
}

/**
 * Get a project
 * @name get-project
 * @param {Object} params - what the keys in the url mean
 * @param {String} params.project - the project id
 * @example
 * curl https://host/projects/project-id
 *  {
 *    id: 'one',
 *    metadata: {}
 *  }
 */
function getProject(req, res, next) {
  Project.findAll({
    limit: 1,
    where: { id: req.params.project }
  })
    .then(function(data) {
      if (data.length === 0) return next();
      res.json(data[0]);
    })
    .catch(next);
}

/**
 */
function createProject(req, res, next) {
  return next();
}

/**
 * Put a project
 * @name put-project
 * @param {Object} params - what the keys in the url mean
 * @param {String} params.project - the project id
 * @param {Object} body - the body of request
 * @param {Object} body.metadata - a flexible object for adding metadata
 * @example
 * curl -X PUT -H "Content-Type: application/json" -d \
 *  '{"metadata": {} }' \
 *   https://host/projects/project-id
 */
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

/**
 */
function deleteProject(req, res, next) {
  return next();
}
