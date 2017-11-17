const ErrorHTTP = require('mapbox-error').ErrorHTTP;
const validator = require('validator');
const paginateSearch = require('../lib/helper/paginateSearch');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../database/index');
const Item = db.Item;
const Project = db.Project;
const geojsonhint = require('@mapbox/geojsonhint');
const validateFC = require('@mapbox/to-fix-validate').validateFeatureCollection;
const constants = require('../lib/constants');
const validateBody = require('../lib/helper/validateBody');
const getQuadkeyForPoint = require('../lib/helper/get-quadkey-for-point');
const _ = require('lodash');
const logDriver = require('../lib/log-driver')('routes/item');

const blankFC = {
  type: 'FeatureCollection',
  features: []
};

module.exports = {
  getItems: getItems,
  createItem: createItem,
  getItem: getItem,
  updateItem: updateItem
};

function getLockedTill(lock) {
  if (constants.LOCKED_STATUS.indexOf(lock) === -1) {
    throw new ErrorHTTP(`Invalid req.query.lock: ${lock}`, 400);
  }
  const locked = lock === constants.LOCKED;
  return {
    [locked ? Op.gt : Op.lt]: new Date()
  };
}

function validateDate(date) {
  if (!validator.isISO8601(date)) {
    throw new ErrorHTTP(
      'from parameter must be a valid ISO 8601 date string',
      400
    );
  }
  return date;
}

function validateStatus(status) {
  if (constants.ALL_STATUS.indexOf(status) === -1) {
    throw new ErrorHTTP(`Invalid status: ${status}`, 400);
  }
  return status;
}

function bboxToEnvelope(bbox) {
  const bb = bbox.split(',').map(n => parseFloat(n));
  if (bb.find(n => Number.isNaN(n) || bb.length !== 4)) {
    throw new ErrorHTTP(`Invalid req.query.bbox: ${bbox}`, 400);
  }
  //TODO: do some validation of the bbox
  return Sequelize.where(
    Sequelize.fn(
      'ST_Within',
      Sequelize.col('pin'),
      Sequelize.fn('ST_MakeEnvelope', bb[0], bb[1], bb[2], bb[3], 4326)
    ),
    true
  );
}

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
 *     featureCollection: {
 *       type: 'FeatureCollection',
 *       features: []
 *     },
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
    const { project } = req.params;
    const where = {
      project_id: project
    };

    if (lock) {
      where.lockedTill = getLockedTill(lock);
    }

    if (from || to) {
      where.createdAt = _.pickBy({
        [Op.gt]: from && validateDate(from),
        [Op.lt]: to && validateDate(to)
      });
    }

    if (status) {
      where.status = validateStatus(status);
    }

    if (bbox) {
      where.bbox = bboxToEnvelope(bbox);
    }

    const { limit, offset } = paginateSearch(page, page_size);

    const search = {
      limit,
      offset,
      where
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
          where: { id: req.params.project }
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

function validateCreateItemBody(body) {
  const validBodyAttrs = [
    'id',
    'lock',
    'pin',
    'status',
    'featureCollection',
    'instructions',
    'metadata'
  ];
  const requiredBodyAttr = ['id', 'instructions', 'pin'];
  const validationError = validateBody(body, validBodyAttrs, requiredBodyAttr);

  if (validationError) {
    throw new ErrorHTTP(validationError, 400);
  }
  return body;
}

function validateAlphanumeric(string) {
  if (!/^[a-zA-Z0-9-]+$/.test(string)) {
    throw new ErrorHTTP(
      'An item must have a valid ID comprised only of letters, numbers, and hyphens',
      400
    );
  }
  return string;
}

function validateInstructions(instructions) {
  if (typeof instructions !== 'string' || instructions.length < 1) {
    throw new ErrorHTTP('An item must have a valid instruction', 400);
  }
  return instructions;
}

function validatePoint(point) {
  const pin = point.coordinates;

  if (!Array.isArray(pin) || pin.length !== 2)
    throw new ErrorHTTP(
      'An item must have a pin in the [longitude, latitude] format',
      400
    );
  const pinErrors = geojsonhint.hint(point, { precisionWarning: false });

  if (pinErrors.length > 0) {
    throw new ErrorHTTP(`Invalid Pin ${pinErrors[0].message}`, 400);
  }

  return point;
}

function validateLock(lock, status) {
  if (lock && status) {
    throw new ErrorHTTP(
      'It is invalid to set the status and change the lock in one request',
      400
    );
  }
  if (constants.LOCKED_STATUS.indexOf(lock) === -1) {
    throw new ErrorHTTP(`Invalid lock change action`, 400);
  }
  return lock;
}

function validateFeatureCollection(fc) {
  var fcErrors = geojsonhint.hint(fc, {
    precisionWarning: false
  });
  if (fcErrors.length > 0) {
    throw new ErrorHTTP(
      'Invalid featureCollection: ' + fcErrors[0].message,
      400
    );
  }
  const tofixValidationErrors = validateFC(fc);
  if (tofixValidationErrors) {
    throw new ErrorHTTP(tofixValidationErrors, 400);
  }
  return fc;
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

    const pin = validatePoint({ type: 'Point', coordinates: body.pin });
    const quadkey = getQuadkeyForPoint(pin);

    const metadata = body.metadata || {};
    const featureCollection = body.featureCollection
      ? validateFeatureCollection(body.featureCollection)
      : blankFC;

    const values = {
      id,
      pin,
      quadkey,
      metadata,
      instructions,
      featureCollection,
      user: username,
      project_id: project,
      createdBy: username
    };

    if (body.lock) {
      const lock = validateLock(body.lock, body.status);
      const isUnlock = lock === constants.UNLOCKED;

      values.lockedTill = isUnlock
        ? new Date()
        : new Date(Date.now() + 1000 * 60 * 15); // put a lock 15 min in future

      values.lockedBy = isUnlock ? null : username;
    }

    if (body.status) {
      const status = validateStatus(body.status);
      if (constants.INACTIVE_STATUS.indexOf(status) !== -1) {
        // If the item has been marked as done, expire the lock
        values.lockedTill = new Date();
        values.lockedBy = null;
      }
      values.status = status;
    }
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

function validateUpdateItemBody(body) {
  const validBodyAttrs = [
    'lock',
    'pin',
    'status',
    'featureCollection',
    'instructions',
    'metadata'
  ];
  const validationError = validateBody(body, validBodyAttrs);

  if (validationError) {
    throw new ErrorHTTP(validationError, 400);
  }
  return body;
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
    const { project, item } = req.params;
    const { username } = req.user;
    const logs = [];
    let values = {};
    const body = validateUpdateItemBody(req.body);
    if (body.lock) {
      const lock = validateLock(body.lock, body.status);
      const isUnlock = lock === constants.UNLOCKED;

      values.lockedTill = isUnlock
        ? new Date()
        : new Date(Date.now() + 1000 * 60 * 15); // put a lock 15 min in future
      values.lockedBy = isUnlock ? null : username;

      logs.push([
        {
          userAction: isUnlock ? 'unlock' : 'lock',
          username: username,
          itemId: item,
          projectId: project
        },
        {
          event: 'itemLock',
          exportLog: true
        }
      ]);
    }
    if (body.pin) {
      values.pin = validatePoint({ type: 'Point', coordinates: body.pin });
      values.quadkey = getQuadkeyForPoint(values.pin);
    }
    if (body.status) {
      const status = validateStatus(body.status);
      if (constants.INACTIVE_STATUS.indexOf(status) !== -1) {
        // If the item has been marked as done, expire the lock
        values.lockedTill = new Date();
        values.lockedBy = null;
      }
      values.status = status;

      logs.push([
        {
          status: status,
          username,
          itemId: item,
          projectId: project
        },
        {
          event: 'itemStatus',
          exportLog: true
        }
      ]);
    }

    if (body.instructions) {
      values.instructions = validateInstructions(body.instructions);
    }

    const featureCollection = body.featureCollection
      ? validateFeatureCollection(body.featureCollection)
      : blankFC;

    if (body.featureCollection) {
      logs.push([
        {
          username: username,
          itemId: item,
          projectId: project
        },
        {
          event: 'itemUpdate',
          exportLog: true
        }
      ]);
    }

    const metadata = body.metadata || {};

    values = Object.assign({}, values, {
      // pin,
      metadata,
      featureCollection,
      id: item,
      user: username,
      project_id: project
    });

    return putItemWrapper(values)
      .then(data => {
        res.json(data);
      })
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
 * Handle all the logic and some validation for item creation and updating
 * @param {Object} opts - the opts for the action
 * @param {String} opts.project - the id of the project the item belongs to
 * @param {String} opts.item - the id of the item itself
 * @param {String} opts.user - the user making the change
 * @param {FeatureCollection} [opts.featureCollection] - a validated GeoJSON feature collection, required on create
 * @param {Point} [opts.pin] - a validated GeoJSON point representing the queryable location of this item, required on create
 * @param {String} [opts.instructions] - the instructions for what needs to be done, required on create
 * @param {String} [opts.status] - the status to set the item to
 * @param {String} [opts.lockedTill] - the time the lock expires at
 */
function putItemWrapper(opts) {
  return Item.findOne({
    where: { id: opts.id, project_id: opts.project_id }
  }).then(function(data) {
    if (
      (opts.lockedTill !== undefined || opts.status !== undefined) && // we're changing the lock or the status
      data.lockedTill > new Date() && // there is an active lock
      data.lockedBy !== opts.user // and its not owned by this user
    ) {
      throw new ErrorHTTP(
        `This item is currently locked by ${data.lockedBy}`,
        423
      );
    }

    // check for an expired lock on status update
    if (opts.status !== undefined && data.lockedTill < new Date()) {
      throw new ErrorHTTP('Cannot update an items status without a lock', 423);
    }

    var featureCollection = opts.featureCollection;
    delete opts.featureCollection; // removing so the merge doesn't try to merge the old feature collection with the new one
    var updated = _.merge({}, data.dataValues, opts);
    updated.featureCollection = featureCollection || updated.featureCollection; // set the feature collection back
    return data.update(updated);
  });
}
