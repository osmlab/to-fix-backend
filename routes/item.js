const ErrorHTTP = require('mapbox-error').ErrorHTTP;
const paginateSearch = require('../lib/helper/paginateSearch');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../database/index');
const Item = db.Item;
const Project = db.Project;
const geojsonhint = require('@mapbox/geojsonhint');
const constants = require('../lib/constants');
const putItemWrapper = require('../lib/put-item');

module.exports = {
  getItems: getItems,
  createItem: createItem,
  getItem: getItem,
  updateItem: updateItem,
  deleteItem: deleteItem
};

/**
 * Get a paginated list of items for a project.
 * @name get-items
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {Object} query - The request URL query parameters
 * @param {('locked'|'unlocked')} [query.lock='locked'] - The item's lock status, must be 'locked' or 'unlocked'
 * @param {string} [query.page=0] - The pagination start page
 * @param {string} [query.page_size=100] - The page size
 * @example
 * curl https://host/projects/:project/items?lock=unlocked
 *
 * [
 *   {
 *     status: 'open',
 *     lockedTill: '2017-10-19T00:00:00.000Z',
 *     siblings: [],
 *     metadata: {},
 *     id: '405270',
 *     project_id: '00000000-0000-0000-0000-000000000000',
 *     pin: {
 *       type: 'Point',
 *       coordinates: [0,0]
 *     },
 *     name: 'My Item',
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

  if (req.query.lock) {
    if (req.query.lock !== 'locked' && req.query.lock !== 'unlocked') {
      return next(new ErrorHTTP('Invalid query lock value ', 400));
    }
    const locked = req.query.lock === 'locked';
    // all items less than current time are unlocked
    // and vice versa
    search.where.lockedTill = {
      [locked ? Op.gt : Op.lt]: new Date()
    };
  }
  Item.findAll(search)
    .then(function(data) {
      if (data.length > 0) return res.json(data);
      return Project.findOne({
        where: { id: req.params.project }
      }).then(function(data) {
        if (data === null) return next();
        res.json([]); // there is a project but it has no items
      });
    })
    .catch(next);
}

/**
 * Create an item in a project.
 * @name create-item
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {string} params.item - The item ID
 * @param {Object} body - The request body
 * @param {string} body.id - An identifier that can be used in future API requests for the item
 * @param {string} body.name - A user-friendly item name
 * @param {string} body.instructions - Instructions on how to work on the item
 * @param {('unlocked'|'locked')} [body.lock] - The item's lock status
 * @param {[Lon,Lat]} [body.pin] - A 2D geometry point to represent the feature
 * @param {('open'|'fixed'|'noterror')} [body.status] - The item's status
 * @param {FeatureCollection} [body.featureCollection] - The item's featureCollection context
 * @example
 * curl -X POST -H "Content-Type: application/json" -d '{"id":"405270","name":"My Item","instructions":"Fix this item","pin":[0,0]}' https://host/projects/:project/items
 *
 * {
 *   status: 'open',
 *   lockedTill: '2017-10-19T00:00:00.000Z',
 *   siblings: [],
 *   metadata: {},
 *   id: '405270',
 *   project_id: '00000000-0000-0000-0000-000000000000',
 *   pin: {
 *     type: 'Point',
 *     coordinates: [0,0]
 *   },
 *   name: 'My Item',
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
    'name',
    'lock',
    'pin',
    'status',
    'featureCollection',
    'instructions'
  ];
  const invalidBodyAttrs = Object.keys(req.body).filter(function(attr) {
    return validBodyAttrs.indexOf(attr) === -1;
  });

  if (invalidBodyAttrs.length !== 0) {
    return next(new ErrorHTTP('Request contains unexpected attributes', 400));
  }

  // validate pin
  const values = { id: req.params.item, project_id: req.params.project };
  if (Array.isArray(req.body.pin)) {
    values.pin = {
      type: 'Point',
      coordinates: req.body.pin
    };
    var pinErrors = geojsonhint.hint(values.pin, {
      precisionWarning: false
    });
    if (pinErrors.length) {
      return next(new ErrorHTTP('Invalid Pin: ' + pinErrors[0].message, 400));
    }
  }

  if (req.body.name) values.name = req.body.name;
  if (req.body.id) values.id = req.body.id;

  if (req.body.instructions) {
    const instructions = req.body.instructions;
    if (typeof instructions !== 'string' || instructions.length < 1) {
      return next(ErrorHTTP('An item must have a valid instruction', 400));
    }
    values.instructions = instructions;
  }

  // validate lock
  if (req.body.lock === 'unlocked') {
    values.lockedTill = new Date();
    values.lockedBy = null;
  } else if (req.body.lock === 'locked') {
    values.lockedTill = new Date(Date.now() + 1000 * 60 * 15); // put a lock 15 min in future
    values.lockedBy = req.user;
  } else if (req.body.lock !== undefined) {
    return next(new ErrorHTTP('Invalid lock change action'));
  } else if (req.body.lock && req.body.status) {
    return next(
      new ErrorHTTP(
        'It is invalid to set the status and change the lock in one request'
      ),
      400
    );
  }

  // validate status
  if (req.body.status) {
    if (constants.ALL_STATUS.indexOf(req.body.status) === -1) {
      return next(new ErrorHTTP('Invalid status', 400));
    }
    values.status = req.body.status;
    if (constants.INACTIVE_STATUS.indexOf(values.status) !== -1) {
      // if the item has been marked as done, expire the lock
      values.lockedTill = new Date();
      values.lockedBy = null;
    }
  }

  // validate feature collection
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
  }

  values.user = req.user;
  values.project = req.params.project;
  values.item = req.params.item;

  if (values.instructions === undefined) {
    throw new ErrorHTTP('instructions is required', 400);
  }
  values.featureCollection = values.featureCollection || {
    type: 'FeatureCollection',
    features: []
  };
  values.createdBy = values.user;
  if (values.pin === undefined) throw new ErrorHTTP('pin is required', 400);

  Item.create(values)
    .then(function(item) {
      res.json(item);
    })
    .catch(next);
}

/**
 * Get an item for a project.
 * @name get-project-item
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {string} params.item - The item ID
 * @example
 * curl https://host/projects/:project/items/:item
 *
 * {
 *   status: 'open',
 *   lockedTill: '2017-10-19T00:00:00.000Z',
 *   siblings: [],
 *   metadata: {},
 *   id: '405270',
 *   project_id: '00000000-0000-0000-0000-000000000000',
 *   pin: {
 *     type: 'Point',
 *     coordinates: [0,0]
 *   },
 *   name: 'My Item',
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

function updateItem(req, res, next) {
  // TODO: provide different status codes based on the status of the item
  const validBodyAttrs = [
    'name',
    'lock',
    'pin',
    'status',
    'featureCollection',
    'instructions'
  ];
  const invalidBodyAttrs = Object.keys(req.body).filter(function(attr) {
    return validBodyAttrs.indexOf(attr) === -1;
  });

  if (invalidBodyAttrs.length !== 0) {
    return next(new ErrorHTTP('Request contains unexpected attributes', 400));
  }

  // validate pin
  const values = { id: req.params.item, project_id: req.params.project };
  if (Array.isArray(req.body.pin)) {
    values.pin = {
      type: 'Point',
      coordinates: req.body.pin
    };
    var pinErrors = geojsonhint.hint(values.pin, {
      precisionWarning: false
    });
    if (pinErrors.length) {
      return next(new ErrorHTTP('Invalid Pin: ' + pinErrors[0].message, 400));
    }
  }

  if (req.body.name) values.name = req.body.name;

  if (req.body.instructions) {
    const instructions = req.body.instructions;
    if (typeof instructions !== 'string' || instructions.length < 1) {
      return next(ErrorHTTP('An item must have a valid instruction', 400));
    }
    values.instructions = instructions;
  }

  // validate lock
  if (req.body.lock === 'unlocked') {
    values.lockedTill = new Date();
    values.lockedBy = null;
  } else if (req.body.lock === 'locked') {
    values.lockedTill = new Date(Date.now() + 1000 * 60 * 15); // put a lock 15 min in future
    values.lockedBy = req.user;
  } else if (req.body.lock !== undefined) {
    return next(new ErrorHTTP('Invalid lock change action'));
  } else if (req.body.lock && req.body.status) {
    return next(
      new ErrorHTTP(
        'It is invalid to set the status and change the lock in one request'
      ),
      400
    );
  }

  // validate status
  if (req.body.status) {
    if (constants.ALL_STATUS.indexOf(req.body.status) === -1) {
      return next(new ErrorHTTP('Invalid status', 400));
    }
    values.status = req.body.status;
    if (constants.INACTIVE_STATUS.indexOf(values.status) !== -1) {
      // if the item has been marked as done, expire the lock
      values.lockedTill = new Date();
      values.lockedBy = null;
    }
  }

  // validate feature collection
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
  }

  values.user = req.user;
  values.project = req.params.project;
  values.item = req.params.item;

  putItemWrapper(values)
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

function deleteItem(req, res, next) {
  return next();
}
