const ErrorHTTP = require('mapbox-error').ErrorHTTP;
const validator = require('validator');
const paginateSearch = require('../lib/helper/paginateSearch');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../database/index');
const Item = db.Item;
const Project = db.Project;
const geojsonhint = require('@mapbox/geojsonhint');
const validateFeatureCollection = require('@mapbox/to-fix-validate')
  .validateFeatureCollection;
const constants = require('../lib/constants');
const validateBody = require('../lib/helper/validateBody');
const getQuadkeyForPoint = require('../lib/helper/get-quadkey-for-point');
const _ = require('lodash');
const logDriver = require('../lib/log-driver')('routes/item');

module.exports = {
  getItems: getItems,
  createItem: createItem,
  getItem: getItem,
  updateItem: updateItem
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
  let search;

  try {
    search = paginateSearch(req.query, {
      where: {
        project_id: req.params.project
      }
    });
  } catch (e) {
    return next(e);
  }

  // don't return featureCollection in listing end-point
  search.attributes = {
    exclude: ['featureCollection']
  };

  if (req.query.lock) {
    if (constants.LOCKED_STATUS.indexOf(req.query.lock) === -1) {
      return next(
        new ErrorHTTP(`Invalid req.query.lock: ${req.query.lock}`, 400)
      );
    }
    const locked = req.query.lock === constants.LOCKED;
    search.where.lockedTill = {
      [locked ? Op.gt : Op.lt]: new Date()
    };
  }

  if (req.query.tags) {
    const tagsArr = req.query.tags.split(',');
    search.include = [
      {
        model: db.Tag,
        as: 'tags',
        where: {
          id: {
            [Op.in]: tagsArr
          }
        }
      }
    ];
  }

  let from, to;
  if (req.query.from) {
    if (!validator.isISO8601(req.query.from)) {
      return next(
        new ErrorHTTP(
          'from parameter must be a valid ISO 8601 date string',
          400
        )
      );
    }
    from = req.query.from;
  }

  if (req.query.to) {
    if (!validator.isISO8601(req.query.to)) {
      return next(
        new ErrorHTTP('to parameter must be a valid ISO 8601 date string', 400)
      );
    }
    to = req.query.to;
  }

  if (from && to) {
    search.where.createdAt = {
      [Op.gt]: from,
      [Op.lt]: to
    };
  } else if (from) {
    search.where.createdAt = {
      [Op.gt]: from
    };
  } else if (to) {
    search.where.createdAt = {
      [Op.lt]: to
    };
  }

  if (req.query.status) {
    if (constants.ALL_STATUS.indexOf(req.query.status) === -1) {
      return next(
        new ErrorHTTP(`Invalid req.query.status: ${req.query.status}`, 400)
      );
    }
    search.where.status = req.query.status;
  }

  if (req.query.bbox) {
    const bb = req.query.bbox.split(',').map(Number);
    //TODO: do some validation of the bbox
    search.where.bbox = Sequelize.where(
      Sequelize.fn(
        'ST_Within',
        Sequelize.col('pin'),
        Sequelize.fn('ST_MakeEnvelope', bb[0], bb[1], bb[2], bb[3], 4326)
      ),
      true
    );
  }

  /* If there are items, return them. If there are not items, confirm that the
  project exists. If the project doesn't exist, return 404 Not Found. Otherwise,
  return empty array. */
  Item.findAndCountAll(search)
    .then(data => {
      if (data.rows.length > 0) {
        const ret = {
          count: data.count,
          items: data.rows
        };
        return res.json(ret);
      }
      return Project.findOne({
        where: { id: req.params.project }
      }).then(data => {
        if (data === null) return next();
        res.json([]);
      });
    })
    .catch(next);
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
  const validationError = validateBody(
    req.body,
    validBodyAttrs,
    requiredBodyAttr
  );
  if (validationError) return next(new ErrorHTTP(validationError, 400));

  const values = { project_id: req.params.project };

  /* Validate ID */
  if (!/^[a-zA-Z0-9-]+$/.test(req.body.id))
    return next(
      new ErrorHTTP(
        'An item must have a valid ID comprised only of letters, numbers, and hyphens',
        400
      )
    );
  values.id = req.body.id;

  /* Validate instructions */
  const instructions = req.body.instructions;
  if (typeof instructions !== 'string' || instructions.length < 1) {
    return next(new ErrorHTTP('An item must have a valid instruction', 400));
  }
  values.instructions = req.body.instructions;

  /* Validate pin */
  if (!Array.isArray(req.body.pin) || req.body.pin.length !== 2)
    return next(
      new ErrorHTTP(
        'An item must have a pin in the [longitude, latitude] format',
        400
      )
    );
  values.pin = { type: 'Point', coordinates: req.body.pin };
  var pinErrors = geojsonhint.hint(values.pin, { precisionWarning: false });
  if (pinErrors.length) {
    return next(new ErrorHTTP(`Invalid Pin ${pinErrors[0].message}`, 400));
  }

  values.quadkey = getQuadkeyForPoint(values.pin);

  /* Validate lock */
  if (req.body.lock) {
    if (req.body.lock && req.body.status) {
      return next(
        new ErrorHTTP(
          'It is invalid to set the status and change the lock in one request'
        ),
        400
      );
    }
    if (constants.LOCKED_STATUS.indexOf(req.body.lock) === -1) {
      return next(new ErrorHTTP(`Invalid lock change action`, 400));
    }
    if (req.body.lock === constants.UNLOCKED) {
      values.lockedTill = new Date();
      values.lockedBy = null;
    } else {
      values.lockedTill = new Date(Date.now() + 1000 * 60 * 15); // put a lock 15 min in future
      values.lockedBy = req.user.username;
    }
  }

  /* Validate status */
  if (req.body.status) {
    if (constants.ALL_STATUS.indexOf(req.body.status) === -1) {
      return next(new ErrorHTTP('Invalid status', 400));
    }
    values.status = req.body.status;
    if (constants.INACTIVE_STATUS.indexOf(values.status) !== -1) {
      // If the item has been marked as done, expire the lock
      values.lockedTill = new Date();
      values.lockedBy = null;
    }
  }

  /* Validate feature collection */
  if (req.body.featureCollection) {
    values.featureCollection = req.body.featureCollection;
    var fcErrors = geojsonhint.hint(values.featureCollection, {
      precisionWarning: false
    });
    if (fcErrors.length) {
      return next(
        new ErrorHTTP('Invalid featureCollection: ' + fcErrors[0].message, 400)
      );
    }
    const tofixValidationErrors = validateFeatureCollection(
      values.featureCollection
    );
    if (tofixValidationErrors) {
      return next(new ErrorHTTP(tofixValidationErrors, 400));
    }
  }
  values.featureCollection = values.featureCollection || {
    type: 'FeatureCollection',
    features: []
  };

  values.metadata = req.body.metadata || {};
  values.user = req.user.username;
  values.createdBy = values.user;

  Item.create(values)
    .then(item => {
      logDriver.info(
        {
          username: req.user.username,
          itemId: item.id,
          projectId: values.project_id
        },
        {
          event: 'itemCreate',
          exportLog: true
        }
      );
      res.json(item);
    })
    .catch(err => {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return next(new ErrorHTTP('Item with this id already exists', 400));
      } else {
        return next(err);
      }
    });
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
  const validBodyAttrs = [
    'lock',
    'pin',
    'status',
    'featureCollection',
    'instructions',
    'metadata'
  ];
  const validationError = validateBody(req.body, validBodyAttrs);
  if (validationError) return next(new ErrorHTTP(validationError, 400));

  const values = { id: req.params.item, project_id: req.params.project };
  const logs = [];

  /* Validate lock */
  if (req.body.lock) {
    if (req.body.lock && req.body.status) {
      return next(
        new ErrorHTTP(
          'It is invalid to set the status and change the lock in one request'
        ),
        400
      );
    }
    if (constants.LOCKED_STATUS.indexOf(req.body.lock) === -1) {
      return next(new ErrorHTTP(`Invalid lock change action`, 400));
    }
    if (req.body.lock === constants.UNLOCKED) {
      values.lockedTill = new Date();
      values.lockedBy = null;
      logs.push([
        {
          userAction: 'unlock',
          username: req.user.username,
          itemId: values.id,
          projectId: values.project_id
        },
        {
          event: 'itemLock',
          exportLog: true
        }
      ]);
    } else {
      logs.push([
        {
          userAction: 'lock',
          username: req.user.username,
          itemId: values.id,
          projectId: values.project_id
        },
        {
          event: 'itemLock',
          exportLog: true
        }
      ]);
      values.lockedTill = new Date(Date.now() + 1000 * 60 * 15); // put a lock 15 min in future
      values.lockedBy = req.user.username;
    }
  }

  /* Validate pin */
  if (req.body.pin) {
    if (!Array.isArray(req.body.pin) || req.body.pin.length !== 2)
      return next(
        new ErrorHTTP(
          'An item must have a pin in the [longitude, latitude] format',
          400
        )
      );
    values.pin = { type: 'Point', coordinates: req.body.pin };
    var pinErrors = geojsonhint.hint(values.pin, { precisionWarning: false });
    if (pinErrors.length) {
      return next(new ErrorHTTP(`Invalid Pin ${pinErrors[0].message}`, 400));
    }
    values.quadkey = getQuadkeyForPoint(values.pin);
  }

  /* Validate status */
  if (req.body.status) {
    if (constants.ALL_STATUS.indexOf(req.body.status) === -1) {
      return next(new ErrorHTTP('Invalid status', 400));
    }
    values.status = req.body.status;
    if (constants.INACTIVE_STATUS.indexOf(values.status) !== -1) {
      // If the item has been marked as done, expire the lock
      values.lockedTill = new Date();
      values.lockedBy = null;
    }
    logs.push([
      {
        status: req.body.status,
        username: req.user.username,
        itemId: values.id,
        projectId: values.project_id
      },
      {
        event: 'itemStatus',
        exportLog: true
      }
    ]);
  }

  /* Validate instructions */
  if (req.body.instructions) {
    const instructions = req.body.instructions;
    if (typeof instructions !== 'string' || instructions.length < 1) {
      return next(ErrorHTTP('An item must have a valid instruction', 400));
    }
    values.instructions = instructions;
  }

  /* Validate feature collection */
  if (req.body.featureCollection) {
    values.featureCollection = req.body.featureCollection;
    var fcErrors = geojsonhint.hint(values.featureCollection, {
      precisionWarning: false
    });
    if (fcErrors.length) {
      return next(
        new ErrorHTTP('Invalid featureCollection: ' + fcErrors[0].message, 400)
      );
    }
    values.featureCollection = values.featureCollection || {
      type: 'FeatureCollection',
      features: []
    };
    logs.push([
      {
        username: req.user.username,
        itemId: values.id,
        projectId: values.project_id
      },
      {
        event: 'itemUpdate',
        exportLog: true
      }
    ]);
  }

  values.user = req.user.username;
  values.metadata = req.body.metadata || {};

  putItemWrapper(values)
    .then(data => {
      logs.forEach(log => {
        logDriver.info(log[0], log[1]);
      });
      res.json(data);
    })
    .catch(next);
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
