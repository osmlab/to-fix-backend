const ErrorHTTP = require('mapbox-error').ErrorHTTP;
const paginateSearch = require('../lib/helper/paginateSearch');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../database/index');
const Item = db.Item;
const Project = db.Project;
const getQuadkeyForPin = require('../lib/helper/get-quadkey-for-pin');
const _ = require('lodash');
const logDriver = require('../lib/log-driver')('routes/item');
const {
  blankFC,
  getLockedTill,
  validateDate,
  validateStatus,
  bboxToEnvelope,
  validateCreateItemBody,
  validateAlphanumeric,
  validateInstructions,
  validatePoint,
  validateFeatureCollection,
  validateUpdateItemBody,
  validateUpdateAllItemsBody,
  validateAndProcessLock,
  validateAndUpdateItem
} = require('../lib/helper/item-route-validators');

module.exports = {
  getItems,
  createItem,
  getItem,
  updateItem,
  updateAllItems
};

/**
 * Get a paginated list of items for a project.
 * @name get-items
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {Object} [query] - The request URL query parameters
 * @param {('locked'|'unlocked')} [query.lock] - The item's lock status, must be 'locked' or 'unlocked'
 * @param {string} [query.page=0] - The pagination start page
 * @param {string} [query.page_size=100] - The page size
 * @param {string} [query.bbox] - BBOX to query by, string in W,S,E,N format (e.g. -1,-1,0,0)
 * @param {string} [query.status] - Status to filter items by
 * @param {string} [query.tags] - Comma-separated list of tag ids
 * @param {string} [query.from] - From date to filter by (must be a valid ISO 8601 date string)
 * @param {string} [query.to] - To date to filter by (must be a valid ISO 8601 date string)
 * @example
 * curl https://host/v1/projects/:project/items
 *
 * [
 *   {
 *     status: 'open',
 *     lockedTill: '2017-10-19T00:00:00.000Z',
 *     metadata: {},
 *     id: '405270',
 *     project_id: '00000000-0000-0000-0000-000000000000',
 *     pin: {
 *       type: 'Point',
 *       coordinates: [0, 0]
 *     },
 *     instructions: 'Fix this item',
 *     createdBy: 'user',
 *     updatedAt: '2017-10-19T00:00:00.000Z',
 *     createdAt: '2017-10-19T00:00:00.000Z',
 *     lockedBy: null
 *   }
 * ]
 */
function getItems(req, res, next) {
  try {
    const { page_size, page, lock, tags, from, to, status, bbox } = req.query;
    const { project: project_id } = req.params;
    let createdAt;

    if (from || to) {
      createdAt = _.pickBy({
        [Op.gt]: from && validateDate(from),
        [Op.lt]: to && validateDate(to)
      });
    }

    const where = {
      createdAt,
      project_id,
      bbox: bbox && bboxToEnvelope(bbox),
      status: status && validateStatus(status),
      lockedTill: lock && getLockedTill(lock)
    };

    const { limit, offset } = paginateSearch(page, page_size);

    const search = {
      limit,
      offset,
      where: _.pickBy(where), // removes any undefined values
      attributes: {
        exclude: ['featureCollection'] // for performance
      }
    };

    if (tags) {
      search.include = [
        {
          model: db.Tag,
          as: 'tags',
          where: {
            id: {
              [Op.in]: tags.split(',')
            }
          }
        }
      ];
    }

    /**
     * If there are items, return them. If there are not items, confirm that the
     * project exists. If the project doesn't exist, return 404 Not Found. Otherwise,
     * return empty array.
     */
    return Item.findAll(search)
      .then(data => {
        if (data.length > 0) {
          return res.json(data);
        }
        return Project.findOne({
          where: { id: project_id }
        }).then(data => {
          if (data == null) return next();
          res.json([]);
        });
      })
      .catch(next);
  } catch (e) {
    next(e);
  }
}

/**
 * Create an item in a project.
 * @name create-item
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {Object} body - The request body
 * @param {string} body.id - An identifier that can be used in future API requests for the item
 * @param {string} body.instructions - Instructions on how to work on the item
 * @param {[Lon,Lat]} body.pin - A 2D geometry point to represent the feature
 * @param {('unlocked'|'locked')} [body.lock] - The item's lock status
 * @param {('open'|'fixed'|'noterror')} [body.status] - The item's status
 * @param {FeatureCollection} [body.featureCollection] - The item's featureCollection context
 * @param {Object} [body.metadata={}] - The item's metadata
 * @example
 * curl -X POST -H "Content-Type: application/json" -d '{"id":"405270","instructions":"Fix this item","pin":[0,0]}' https://host/v1/projects/00000000-0000-0000-0000-000000000000/items
 *
 * {
 *   status: 'open',
 *   lockedTill: '2017-10-19T00:00:00.000Z',
 *   metadata: {},
 *   id: '405270',
 *   project_id: '00000000-0000-0000-0000-000000000000',
 *   pin: {
 *     type: 'Point',
 *     coordinates: [0, 0]
 *   },
 *   instructions: 'Fix this item',
 *   featureCollection: {
 *     type: 'FeatureCollection',
 *     features: []
 *   },
 *   createdBy: 'user',
 *   updatedAt: '2017-10-19T00:00:00.000Z',
 *   createdAt: '2017-10-19T00:00:00.000Z',
 *   lockedBy: null
 * }
 */
function createItem(req, res, next) {
  try {
    const { project } = req.params;
    const { username } = req.user;

    const body = validateCreateItemBody(req.body);

    const id = validateAlphanumeric(body.id);
    const instructions = validateInstructions(body.instructions);
    const point = validatePoint({ type: 'Point', coordinates: body.pin });
    const quadkey = getQuadkeyForPin(body.pin);

    const { lockedBy, lockedTill, status } = validateAndProcessLock(
      body.lock,
      body.status,
      username
    );

    const metadata = body.metadata || {};
    const featureCollection = body.featureCollection
      ? validateFeatureCollection(body.featureCollection)
      : blankFC;

    let values = _.pickBy({
      createdBy: username,
      featureCollection,
      id,
      instructions,
      lockedBy,
      lockedTill,
      metadata,
      pin: point,
      project_id: project,
      quadkey,
      status,
      user: username
    });

    Item.create(values)
      .then(item => {
        res.json(item);
      })
      .then(() => {
        logDriver.info(
          {
            username,
            itemId: id,
            projectId: project
          },
          {
            event: 'itemCreate',
            exportLog: true
          }
        );
      })
      .catch(err => {
        if (err instanceof Sequelize.UniqueConstraintError) {
          return next(new ErrorHTTP('Item with this id already exists', 400));
        } else {
          return next(err);
        }
      });
  } catch (err) {
    next(err);
  }
}

/**
 * Get an item for a project.
 * @name get-item
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {string} params.item - The item ID
 * @example
 * curl https://host/v1/projects/00000000-0000-0000-0000-000000000000/items/405270
 *
 * {
 *   status: 'open',
 *   lockedTill: '2017-10-19T00:00:00.000Z',
 *   metadata: {},
 *   id: '405270',
 *   project_id: '00000000-0000-0000-0000-000000000000',
 *   pin: {
 *     type: 'Point',
 *     coordinates: [0,0]
 *   },
 *   instructions: 'Fix this item',
 *   featureCollection: {
 *     type: 'FeatureCollection',
 *     features: []
 *   },
 *   createdBy: 'user',
 *   updatedAt: '2017-10-19T00:00:00.000Z',
 *   createdAt: '2017-10-19T00:00:00.000Z',
 *   lockedBy: null
 * }
 */
function getItem(req, res, next) {
  Item.findOne({
    where: {
      id: req.params.item,
      project_id: req.params.project
    }
  })
    .then(function(data) {
      if (data === null) return next();
      res.json(data);
    })
    .catch(next);
}

/**
 * Update a project item.
 * @name update-item
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {string} params.item - The item ID
 * @param {Object} body - The request body
 * @param {('unlocked'|'locked')} [body.lock] - The item's lock status
 * @param {[Lon,Lat]} [body.pin] - A 2D geometry point to represent the feature
 * @param {('open'|'fixed'|'noterror')} [body.status] - The item's status
 * @param {FeatureCollection} [body.featureCollection] - The item's featureCollection context
 * @param {string} [body.instructions] - Instructions on how to work on the item
 * @param {Object} [body.metadata] - The item's metadata
 * @example
 * curl -X PUT -H "Content-Type: application/json" -d '{"instructions":"Different instructions for fixing the item"}' https://host/v1/projects/00000000-0000-0000-0000-000000000000/items/405270
 *
 * {
 *   status: 'open',
 *   lockedTill: '2017-10-19T00:00:00.000Z',
 *   metadata: {},
 *   id: '405270',
 *   project_id: '00000000-0000-0000-0000-000000000000',
 *   pin: {
 *     type: 'Point',
 *     coordinates: [0, 0]
 *   },
 *   instructions: 'Different instructions for fixing the item',
 *   featureCollection: {
 *     type: 'FeatureCollection',
 *     features: []
 *   },
 *   createdBy: 'user',
 *   updatedAt: '2017-10-19T00:00:00.000Z',
 *   createdAt: '2017-10-19T00:00:00.000Z',
 *   lockedBy: null
 * }
 */
function updateItem(req, res, next) {
  try {
    const { project: project_id, item } = req.params;
    const { username } = req.user;
    const logs = [];
    const body = validateUpdateItemBody(req.body);

    const { lockedBy, lockedTill, status } = validateAndProcessLock(
      body.lock,
      body.status,
      username
    );

    const point =
      body.pin && validatePoint({ type: 'Point', coordinates: body.pin });

    const quadkey = body.pin && getQuadkeyForPin(body.pin);

    const instructions =
      body.instructions && validateInstructions(body.instructions);

    const featureCollection = body.featureCollection
      ? validateFeatureCollection(body.featureCollection)
      : blankFC;

    const metadata = body.metadata || {};

    const values = _.pickBy({
      featureCollection,
      id: item,
      instructions,
      metadata,
      pin: point,
      project_id,
      quadkey,
      status,
      user: username,
      lockedBy,
      lockedTill
    });

    // validateAndUpdateItem needs `lockedBy` and `lockedTill` when merging to overwrite the entry in db.
    values.lockedBy = lockedBy;
    values.lockedTill = lockedTill;

    if (body.status) {
      logs.push([
        {
          status: body.status,
          username,
          itemId: item,
          projectId: project_id
        },
        {
          event: 'itemStatus',
          exportLog: true
        }
      ]);
    }
    if (body.featureCollection) {
      logs.push([
        {
          username: username,
          itemId: item,
          projectId: project_id
        },
        {
          event: 'itemUpdate',
          exportLog: true
        }
      ]);
    }

    return Item.findOne({
      where: { id: item, project_id }
    })
      .then(data => data.update(validateAndUpdateItem(data.dataValues, values)))
      .then(data => res.json(data))
      .then(() => {
        logs.forEach(log => {
          logDriver.info(log[0], log[1]);
        });
      })
      .catch(next);
  } catch (err) {
    next(err);
  }
}

/**
 * Updates an array of items. Note: max limit is 500
 * @name update-all-item
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {Object[]} body - The request body
 * @param {String[]} [body.ids] - The item's unique iD
 * @param {('unlocked'|'locked')} [body.lock] - The item's lock status
 * @param {('open'|'fixed'|'noterror')} [body.status] - The item's status
 * @example
 * curl -X PUT -H "Content-Type: application/json" -d '{lock: 'locked', ids: ["111111", "2222222"]}' https://host/v1/projects/00000000-0000-0000-0000-000000000000/items
 * [
 *   {
 *     status: 'open',
 *     lockedTill: '2017-10-19T00:00:00.000Z',
 *     metadata: {},
 *     id: '111111',
 *     project_id: '00000000-0000-0000-0000-000000000000',
 *     pin: {
 *       type: 'Point',
 *       coordinates: [0, 0]
 *     },
 *     instructions: 'Fix this item',
 *     createdBy: 'user',
 *     updatedAt: '2017-10-19T00:00:00.000Z',
 *     createdAt: '2017-10-19T00:00:00.000Z',
 *     lockedBy: 'you',
 *     lockedTill: '2017-10-19T00:15:00.000Z'
 *   },
 *   {
 *     status: 'open',
 *     lockedTill: '2017-10-19T00:00:00.000Z',
 *     metadata: {},
 *     id: '2222222',
 *     project_id: '00000000-0000-0000-0000-000000000000',
 *     pin: {
 *       type: 'Point',
 *       coordinates: [0, 0]
 *     },
 *     instructions: 'Fix this item',
 *     createdBy: 'user',
 *     updatedAt: '2017-10-19T00:00:00.000Z',
 *     createdAt: '2017-10-19T00:00:00.000Z',
 *     lockedBy: 'you',
 *     lockedTill: '2017-10-19T00:15:00.000Z'
 *   }
 * ]
 */
function updateAllItems(req, res, next) {
  try {
    const { project: project_id } = req.params;

    const { username } = req.user;
    const body = validateUpdateAllItemsBody(req.body);

    const { lockedTill, lockedBy, lock, status } = validateAndProcessLock(
      body.lock,
      body.status,
      username
    );

    const itemIds = body.ids;

    const search = {
      where: {
        project_id,
        id: {
          [Op.in]: itemIds
        }
      }
    };

    Item.findAll(search)
      .then(data => {
        if (data.length !== itemIds.length) {
          throw new ErrorHTTP('item ids were not found in database');
        }
        const oldItems = data
          .map(item => item.dataValues)
          .reduce((prev, item) => {
            prev[item.id] = item;
            return prev;
          }, {});

        // validate if the user can do
        itemIds.forEach(id =>
          validateAndUpdateItem(oldItems[id], {
            lockedTill,
            lockedBy,
            lock,
            status,
            user: username
          })
        );
        return Item.update(
          {
            lockedTill,
            lockedBy,
            status
          },
          Object.assign({}, search, { returning: true })
        );
      })
      .then(data => {
        res.json(data[1]);
      })
      .catch(next);
  } catch (err) {
    next(err);
  }
}
