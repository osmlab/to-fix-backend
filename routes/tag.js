'use strict';

const db = require('../database/index');
const Tag = db.Tag;
const ErrorHTTP = require('mapbox-error').ErrorHTTP;
const validateBody = require('../lib/helpers/validateBody');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = {
  /* Project-level operations */
  getProjectTags: getProjectTags,
  createProjectTag: createProjectTag,
  getProjectTag: getProjectTag,
  updateProjectTag: updateProjectTag,
  deleteProjectTag: deleteProjectTag,
  /* Item-level operations */
  getItemTags: getItemTags,
  createItemTag: createItemTag,
  deleteItemTag: deleteItemTag
};

/**
 * Get a list of project tags.
 * @name get-project-tag
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {Object} [query] - The request URL query parameters
 * @param {string} [query.tag] - String to filter tag names by
 * @exampledecodeURIComponent(string)
 * curl https://host/projects/:project/tags
 */
function getProjectTags(req, res, next) {
  let where = { project_id: req.params.project };
  if (req.query.tag) {
    const decodedTag = decodeURIComponent(req.query.tag);
    where.name = { [Op.like]: `%${decodedTag}%` };
  }
  Tag.findAll({ where: where })
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

/**
 * Create a project tag.
 * @name create-project-tag
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {Object} body - The request payload
 * @param {string} body.name - The tag name
 * @param {Object} [body.metadata={}] - The tag metadata
 * @example
 * curl -X POST -H "Content-Type: application/json" -d '{"name":"My Tag"}' https://host/projects/:project/tags
 */
function createProjectTag(req, res, next) {
  const validBodyAttrs = ['name', 'metadata'];
  const requiredBodyAttr = ['name'];
  const validationError = validateBody(
    req.body,
    validBodyAttrs,
    requiredBodyAttr
  );
  if (validationError) return next(new ErrorHTTP(validationError, 400));

  const opts = Object.assign({}, req.body, { project_id: req.params.project });
  Tag.create(opts)
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

/**
 * Get a project tag.
 * @name get-project-tag
 * @param {Object} params - The request URL parameters
 * @param {string} params.tag - The tag ID
 * @param {string} params.project - The project ID
 * @example
 * curl https://host/projects/00000000-0000-0000-0000-000000000000/tags/11111111-1111-1111-1111-111111111111
 */
function getProjectTag(req, res, next) {
  Tag.findAll({
    where: {
      id: req.params.tag,
      project_id: req.params.project
    }
  })
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

/**
 * Update a project tag.
 * @name update-project-tag
 * @param {Object} params - The request URL parameters
 * @param {string} params.tag - The tag ID
 * @param {string} params.project - The project ID
 * @param {Object} body - The request payload
 * @param {string} [body.name] - The new tag name
 * @param {Object} [body.metadata] - The new tag metadata
 * @example
 * curl -X PUT -H "Content-Type: application/json" -d '{"metadata":{"key":"value"}}' https://host/projects/00000000-0000-0000-0000-000000000000/tags/11111111-1111-1111-1111-111111111111
 */
function updateProjectTag(req, res, next) {
  const validBodyAttrs = ['name', 'metadata'];
  const validationError = validateBody(req.body, validBodyAttrs);
  if (validationError) return next(new ErrorHTTP(validationError, 400));

  // Need to confirm that metadata either overwrites existing metadata, or develop
  // a system for users to be able to remove metadata in addition to appending
  Tag.update(req.body, {
    where: { id: req.params.tag, project_id: req.params.project }
  })
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

/**
 * Delete a project tag.
 * @name delete-project-tag
 * @param {Object} params - The request URL parameters
 * @param {string} params.tag - The tag ID
 * @param {string} params.project - The project ID
 * @example
 * curl -X DELETE https://host/projects/00000000-0000-0000-0000-000000000000/tags/11111111-1111-1111-1111-111111111111
 */
function deleteProjectTag(req, res, next) {
  Tag.destroy({
    where: {
      id: req.params.tag,
      project_id: req.params.project
    }
  })
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

/**
 * Get all tags for an item.
 */
function getItemTags(req, res, next) {
  return next();
}

/**
 * Add a tag to an item.
 */
function createItemTag(req, res, next) {
  return next();
}

/**
 * Remove a tag from an item.
 */
function deleteItemTag(req, res, next) {
  return next();
}
