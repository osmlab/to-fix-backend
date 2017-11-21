'use strict';

const _ = require('lodash');
const ErrorHTTP = require('mapbox-error').ErrorHTTP;
const Sequelize = require('sequelize');
const db = require('../database/index');
const Project = db.Project;
const validateBody = require('../lib/helper/validateBody');

module.exports = {
  getProjects: getProjects,
  getProjectStats: getProjectStats,
  createProject: createProject,
  getProject: getProject,
  updateProject: updateProject,
  deleteProject: deleteProject
};

/**
 * Get a list of projects.
 * @name get-projects
 * @param {Object} [query] - The request URL query parameters
 * @param {string} [query.name] - Name of project to filter by (optional)
 * @param {true|false} [query.is_archived] - default is false - set to true to return archived projects
 * @example
 * curl https://host/v1/projects
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
  let search = {};
  let where = {};
  if (req.query.is_archived && req.query.is_archived === 'true') {
    where.is_archived = true;
  } else {
    where.is_archived = false;
  }
  //FIXME: this is probably not the best way to implement this
  // since a search for a name should always return a maximum of 1 item
  if (req.query.name) {
    where.name = req.query.name;
  }
  search.where = where;
  Project.findAll(search)
    .then(function(projects) {
      res.json(projects);
    })
    .catch(next);
}

/**
 * Get stats for a project
 * @name get-project-stats
 * @example
 * curl https://host/v1/projects/00000000-0000-0000-0000-000000000000/stats
 *
 * {
 *   "total": 3,
 *   "status": {
 *     "closed": 1,
 *     "open": 2
 *   },
 *   "tags": {
 *     "foo": 2,
 *     "bar": 2,
 *     "baz": 1
 *   }
 * }
 */
function getProjectStats(req, res, next) {
  const projectId = req.params.project;
  const countPromises = [
    db.Item.count({
      where: {
        project_id: projectId
      }
    }),
    db.Item.findAll({
      attributes: ['status', Sequelize.fn('COUNT', Sequelize.col('status'))],
      where: {
        project_id: projectId
      },
      group: ['status'],
      raw: true
    }),
    db.Item.findAll({
      includeIgnoreAttributes: false,
      include: [
        {
          model: db.Tag,
          attributes: ['id', 'name'],
          through: {
            attributes: []
          }
        }
      ],
      attributes: [
        'tags.name',
        Sequelize.fn('COUNT', Sequelize.col('item.id'))
      ],
      where: {
        project_id: projectId
      },
      group: ['tags.name'],
      distinct: true,
      raw: true
    })
  ];
  Promise.all(countPromises)
    .then(results => {
      const total = results[0];
      const status = results[1].reduce((memo, value) => {
        memo[value.status] = Number(value.count);
        return memo;
      }, {});
      const tags = results[2].reduce((memo, value) => {
        memo[value.name] = Number(value.count);
        return memo;
      }, {});
      return res.json({
        total: total,
        status: status,
        tags: tags
      });
    })
    .catch(err => {
      return next(err);
    });
}

/**
 * Create a project.
 * @name create-project
 * @param {Object} body - The request body
 * @param {string} body.name - The project name
 * @param {string} [body.quadkey_set_id] - Quadkey Set ID for this project
 * @param {Object} [body.metadata={}] - The project metadata
 * @example
 * curl -X POST -H "Content-Type: application/json" -d '{"name":"My Project"}' https://host/v1/projects
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
  const validBodyAttrs = ['name', 'quadkey_set_id', 'metadata'];
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
    .catch(err => {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return next(new ErrorHTTP('Project with name already exists', 400));
      } else {
        return next(err);
      }
    });
}

/**
 * Get a project.
 * @name get-project
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @example
 * curl https://host/v1/projects/00000000-0000-0000-0000-000000000000
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
 * @name update-project
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {Object} body - The request body
 * @param {string} [body.name] - The project name
 * @param {string} [body.quadkey_set_id] - Quadkey Set ID for this project
 * @param {Object} [body.metadata] - The project metadata
 * @example
 * curl -X PUT -H "Content-Type: application/json" -d '{"metadata":{"key":"value"}}' https://host/v1/projects/00000000-0000-0000-0000-000000000000
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
  const validBodyAttrs = ['name', 'quadkey_set_id', 'metadata'];
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
 * Delete a project. Marks a project as "soft deleted"
 * @name delete-project
 * @param {Object} params - Request URL params
 * @param {string} params.project - Project ID
 * @example curl -X DELETE https://host/v1/projects/00000000-0000-0000-0000-000000000000
 * {"id": "00000000-0000-0000-0000-000000000000"}
 */
function deleteProject(req, res, next) {
  const projectId = req.params.project;
  return Project.update(
    {
      is_archived: true
    },
    {
      where: {
        id: projectId
      }
    }
  )
    .then(updated => {
      // `updated` is an array whose first member is the count of objects updated:
      // http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-update
      const updatedCount = updated[0];
      if (updatedCount === 0) {
        return next(new ErrorHTTP('Project not found', 404));
      }
      return res.json({ id: projectId });
    })
    .catch(next);
}
