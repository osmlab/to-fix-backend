'use strict';

const db = require('../database/index');
const Tag = db.Tag;
const ErrorHTTP = require('mapbox-error').ErrorHTTP;
const validateBody = require('../lib/helper/validateBody');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const Item = db.Item;

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
 * @param {string} params.version - The API version
 * @param {string} params.project - The project ID
 * @param {Object} [query] - The request URL query parameters
 * @param {string} [query.tag] - String to filter tag names by
 * @example
 * curl https://host/v1/projects/00000000-0000-0000-0000-000000000000/tags
 *
 * [
 *   {
 *     id: '22222222-2222-2222-2222-222222222222',
 *     project_id: '00000000-0000-0000-0000-000000000000',
 *     name: 'My Tag',
 *     metadata: {},
 *     createdAt: '2017-10-20T00:00:00.000Z',
 *     updatedAt: '2017-10-20T00:00:00.000Z'
 *   }
 * ]
 */
function getProjectTags(req, res, next) {
  let where = { project_id: req.params.project };
  if (req.query.tag) {
    const decodedTag = decodeURIComponent(req.query.tag);
    where.name = { [Op.like]: `%${decodedTag}%` };
  }
  Tag.findAll({ where: where })
    .then(data => {
      res.json(data);
    })
    .catch(next);
}

/**
 * Create a project tag.
 * @name create-project-tag
 * @param {Object} params - The request URL parameters
 * @param {string} params.version - The API version
 * @param {string} params.project - The project ID
 * @param {Object} body - The request payload
 * @param {string} body.name - The tag name
 * @param {Object} [body.metadata={}] - The tag metadata
 * @example
 * curl -X POST -H "Content-Type: application/json" -d '{"name":"My Tag"}' https://host/v1/projects/00000000-0000-0000-0000-000000000000/tags
 *
 * {
 *   id: '33333333-3333-3333-3333-333333333333',
 *   metadata: {},
 *   name: 'My Tag',
 *   project_id: '00000000-0000-0000-0000-000000000000',
 *   updatedAt: '2017-10-20T00:00:00.000Z',
 *   createdAt: '2017-10-20T00:00:00.000Z'
 * }
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
 * @param {string} params.version - The API version
 * @param {string} params.project - The project ID
 * @param {string} params.tag - The tag ID
 * @example
 * curl https://host/projects/00000000-0000-0000-0000-000000000000/tags/33333333-3333-3333-3333-333333333333
 *
 * {
 *   id: '33333333-3333-3333-3333-333333333333',
 *   metadata: {},
 *   name: 'My Tag Tag',
 *   project_id: '00000000-0000-0000-0000-000000000000',
 *   updatedAt: '2017-10-20T00:00:00.000Z',
 *   createdAt: '2017-10-20T00:00:00.000Z'
 * }
 */
function getProjectTag(req, res, next) {
  Tag.findOne({
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
 * @param {string} params.version - The API version
 * @param {string} params.project - The project ID
 * @param {string} params.tag - The tag ID
 * @param {Object} body - The request payload
 * @param {string} [body.name] - The new tag name
 * @param {Object} [body.metadata] - The new tag metadata
 * @example
 * curl -X PUT -H "Content-Type: application/json" -d '{"metadata":{"key":"value"}}' https://host/v1/projects/00000000-0000-0000-0000-000000000000/tags/33333333-3333-3333-3333-333333333333
 *
 * [1]
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
 * @param {string} params.version - The API version
 * @param {string} params.project - The project ID
 * @param {string} params.tag - The tag ID
 * @example
 * curl -X DELETE https://host/v1/projects/00000000-0000-0000-0000-000000000000/tags/11111111-1111-1111-1111-111111111111
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
 * @name get-item-tags
 * @param {Object} params - The request URL parameters
 * @param {string} params.version - The API version
 * @param {string} params.project - The project ID
 * @param {string} params.item - The item ID
 * @example
 * curl http://host/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags
 *
 * [
 *   {
 *     id: '22222222-2222-2222-2222-222222222222',
 *     project_id: '00000000-0000-0000-0000-000000000000',
 *     name: 'My Tag',
 *     metadata: {},
 *     createdAt: '2017-10-20T00:00:00.000Z',
 *     updatedAt: '2017-10-20T00:00:00.000Z',
 *     item_tag: {
 *       createdAt: '2017-10-20T00:00:00.000Z',
 *       updatedAt: '2017-10-20T00:00:00.000Z',
 *       itemAutoId: 1,
 *       tagId: '22222222-2222-2222-2222-222222222222'
 *     }
 *   }
 * ]
 */
function getItemTags(req, res, next) {
  Item.findOne({
    where: { id: req.params.item, project_id: req.params.project }
  })
    .then(data => {
      return data.getTags();
    })
    .then(data => {
      res.json(data);
    })
    .catch(next);
}

/**
 * Add a tag to an item.
 * @name create-item-tag
 * @param {Object} params - The request URL parameters
 * @param {string} params.version - The API version
 * @param {string} params.project - The project ID
 * @param {string} params.item - The item ID
 * @param {Object} body - The request payload
 * @param {string} body.tag - The tag ID
 * @example
 * curl -X POST -H "Content-Type: application/json" -d '{"tag":"22222222-2222-2222-2222-222222222222"}' https://host/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags
 *
 * [
 *   {
 *     id: '22222222-2222-2222-2222-222222222222',
 *     project_id: '00000000-0000-0000-0000-000000000000',
 *     name: 'My Tag',
 *     metadata: {},
 *     createdAt: '2017-10-20T00:00:00.000Z',
 *     updatedAt: '2017-10-20T00:00:00.000Z',
 *     item_tag: {
 *       createdAt: '2017-10-20T00:00:00.000Z',
 *       updatedAt: '2017-10-20T00:00:00.000Z',
 *       itemAutoId: 1,
 *       tagId: '22222222-2222-2222-2222-222222222222'
 *     }
 *   }
 * ]
 */
function createItemTag(req, res, next) {
  let store = {};
  Item.findOne({
    where: { id: req.params.item, project_id: req.params.project }
  })
    .then(data => {
      store.item = data;
      return Tag.findOne({
        where: { id: req.body.tag, project_id: req.params.project }
      });
    })
    .then(data => {
      store.tag = data;
      return store.item.setTags(data);
    })
    .then(() => {
      return store.item.getTags({ where: { id: req.body.tag } });
    })
    .then(data => {
      res.json(data);
    })
    .catch(next);
}

/**
 * Remove a tag from an item.
 * @name delete-item-tag
 * @param {Object} params - The request URL parameters
 * @param {string} params.version - The API version
 * @param {string} params.project - The project ID
 * @param {string} params.item - The item ID
 * @param {string} params.tag - The tag ID
 * @returns {Object[]} tags - An array of remaining tags on the item
 * @example
 * curl -X DELETE https://host/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags/22222222-2222-2222-2222-222222222222
 *
 * []
 */
function deleteItemTag(req, res, next) {
  let store = {};
  Item.findOne({
    where: { id: req.params.item, project_id: req.params.project }
  })
    .then(data => {
      store.item = data;
      data.removeTags(req.params.tag);
    })
    .then(() => {
      return store.item.getTags();
    })
    .then(tags => {
      res.json(tags);
    })
    .catch(next);
}
