'use strict';

const db = require('../database/index');
const Tag = db.Tag;
const ErrorHTTP = require('mapbox-error').ErrorHTTP;
const validateBody = require('../lib/helper/validateBody');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const Item = db.Item;
const _ = require('lodash');
const Project = db.Project;
const logDriver = require('../lib/log-driver')('routes/tag');

const logEvent = 'tags';

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
 * @name get-project-tags
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
  let whereProject = { id: req.params.project };
  let whereTag = { project_id: req.params.project };
  if (req.query.tag) {
    const decodedTag = decodeURIComponent(req.query.tag);
    whereTag.name = { [Op.like]: `%${decodedTag}%` };
  }

  Project.findOne({ where: whereProject })
    .then(data => {
      if (!data) throw new ErrorHTTP('Invalid project ID', 400);
      return Tag.findAll({ where: whereTag });
    })
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
  const where = { id: req.params.project };
  const validBodyAttrs = ['name', 'metadata'];
  const requiredBodyAttrs = ['name'];
  const validationError = validateBody(
    req.body,
    validBodyAttrs,
    requiredBodyAttrs
  );
  if (validationError) throw new ErrorHTTP(validationError, 400);
  const options = _.extend(req.body, { project_id: req.params.project });

  Project.findOne({ where: where })
    .then(data => {
      if (!data) throw new ErrorHTTP('Invalid project ID', 400);
      return Tag.create(options);
    })
    .then(data => {
      logDriver.info(
        {
          username: req.user.username,
          action: 'create-project-tag',
          projectId: options.project_id,
          tag: options.name
        },
        {
          event: logEvent,
          exportLog: true
        }
      );
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
  const whereProject = { id: req.params.project };
  const whereTag = { project_id: req.params.project, id: req.params.tag };

  Project.findOne({ where: whereProject })
    .then(data => {
      if (!data) throw new ErrorHTTP('Invalid project ID', 400);
      return Tag.findOne({ where: whereTag });
    })
    .then(data => {
      if (!data) throw new ErrorHTTP('Invalid tag ID', 400);
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
 * {
 *   id: '33333333-3333-3333-3333-333333333333',
 *   metadata: {
 *     key: 'value'
 *   },
 *   name: 'My Tag',
 *   project_id: '00000000-0000-0000-0000-000000000000',
 *   updatedAt: '2017-10-20T01:00:00.000Z',
 *   createdAt: '2017-10-20T00:00:00.000Z'
 * }
 */
function updateProjectTag(req, res, next) {
  const whereProject = { id: req.params.project };
  const whereTag = { project_id: req.params.project, id: req.params.tag };

  const validBodyAttrs = ['name', 'metadata'];
  const validationError = validateBody(req.body, validBodyAttrs);
  if (validationError) throw new ErrorHTTP(validationError, 400);

  Project.findOne({ where: whereProject })
    .then(data => {
      if (!data) throw new ErrorHTTP('Invalid project ID', 400);
      return Tag.findOne({ where: whereTag });
    })
    .then(data => {
      if (!data) throw new ErrorHTTP('Invalid tag ID', 400);
      const updatedBody = _.merge({}, data.dataValues, req.body);
      return Tag.update(updatedBody, { where: whereTag, returning: true });
    })
    .then(data => {
      res.json(data[1]);
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
 *
 * { message: 'Succesfully deleted tag 11111111-1111-1111-1111-111111111111' }
 */
function deleteProjectTag(req, res, next) {
  const whereProject = { id: req.params.project };
  const whereTag = { project_id: req.params.project, id: req.params.tag };

  Project.findOne({ where: whereProject })
    .then(data => {
      if (!data) throw new ErrorHTTP('Invalid project ID', 400);
      return Tag.destroy({ where: whereTag });
    })
    .then(data => {
      if (data === 0) throw new ErrorHTTP('Invalid tag ID', 400);
      logDriver.info(
        {
          action: 'delete-project-tag',
          username: req.user.username,
          projectId: req.params.project,
          tagId: req.params.tag
        },
        {
          event: logEvent,
          exportLog: true
        }
      );
      res.json({ message: `Successfully deleted tag ${req.params.tag}` });
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
 *       tagId: '22222222-2222-2222-2222-222222222222',
 *       authorName: 'osm-user',
 *       authorId: '0001'
 *     }
 *   }
 * ]
 */
function getItemTags(req, res, next) {
  const whereProject = { id: req.params.project };
  const whereItem = { project_id: req.params.project, id: req.params.item };
  // const whereTagAuthor = {res};

  Project.findOne({ where: whereProject })
    .then(data => {
      if (!data) throw new ErrorHTTP('Invalid project ID', 400);
      return Item.findOne({ where: whereItem });
    })
    .then(data => {
      if (!data) throw new ErrorHTTP('Invalid item ID', 400);
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
 *       tagId: '22222222-2222-2222-2222-222222222222',
 *       authorName: 'osm-user',
 *       authorId: '0001'
 *     }
 *   }
 * ]
 */
function createItemTag(req, res, next) {
  let store = {};
  const whereProject = { id: req.params.project };
  const whereItem = { project_id: req.params.project, id: req.params.item };
  const whereTag = { project_id: req.params.project, id: req.body.tag };
  let tagName;
  Project.findOne({ where: whereProject })
    .then(data => {
      if (!data) throw new ErrorHTTP('Invalid project ID', 400);
      return Item.findOne({ where: whereItem });
    })
    .then(data => {
      if (!data) throw new ErrorHTTP('Invalid item ID', 400);
      store.item = data;
      return Tag.findOne({ where: whereTag });
    })
    .then(data => {
      if (!data) throw new ErrorHTTP('Invalid tag ID', 400);
      store.tag = data;
      tagName = data.name;
      return store.item.addTag(data, {
        through: { authorName: req.user.username, authorId: req.user.id }
      });
    })
    .then(() => {
      return store.tag.getItems({ where: { id: req.params.item } });
    })
    .then(data => {
      logDriver.info(
        {
          username: req.user.username,
          action: 'create-item-tag',
          itemId: req.params.item,
          projectId: req.params.project,
          tag: tagName
        },
        {
          event: logEvent,
          exportLog: true
        }
      );
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
 * {
 *   id: '111111',
 *   project_id: '00000000-0000-0000-0000-000000000000',
 *   pin: { type: 'Point', coordinates: [77, 77] },
 *   instructions: 'Fix this item',
 *   createdBy: 'user',
 *   featureCollection: { type: 'FeatureCollection', features: [] },
 *   status: 'open',
 *   lockedBy: null,
 *   metadata: {},
 *   sort: 0,
 *   createdAt: '2017-10-20T00:00:00.000Z',
 *   updatedAt: '2017-10-20T00:00:00.000Z',
 *   lockedTill: '2017-10-20T00:00:00.000Z'
 * }
 */
function deleteItemTag(req, res, next) {
  let store = {};
  const whereProject = { id: req.params.project };
  const whereItem = { project_id: req.params.project, id: req.params.item };

  Project.findOne({ where: whereProject })
    .then(data => {
      if (!data) throw new ErrorHTTP('Invalid project ID', 400);
      return Item.findOne({ where: whereItem });
    })
    .then(data => {
      if (!data) throw new ErrorHTTP('Invalid item ID', 400);
      store.item = data;
      return store.item.removeTag(req.params.tag, { returning: true });
    })
    .then(data => {
      if (!data)
        throw new ErrorHTTP(
          `Tag ID ${req.params.tag} was not associated with item ${
            req.params.item
          }`,
          400
        );
      return Item.findOne({ whereItem });
    })
    .then(data => {
      logDriver.info(
        {
          username: req.user.username,
          action: 'delete-item-tag',
          itemId: req.params.item,
          projectId: req.params.project,
          tagId: req.params.tag
        },
        {
          event: logEvent,
          exportLog: true
        }
      );
      res.json(data);
    })
    .catch(next);
}

// Failed to start debugger. Exit code was ENOENT which indicates that the node executable could not be found. Try specifying an explicit path in your atom config file using the node-debugger.nodePath configuration setting.
